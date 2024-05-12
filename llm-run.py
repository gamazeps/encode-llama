#!/usr/bin/env python3
import difflib
import math
import sqlite3
import sys
import time
import re
import random
import traceback

import requests
import json
import pickle


try:
    with open('data/gencode.v40.annotation.pickle', 'rb') as f:
        gencode = pickle.load(f)
except:
    import gtfparse
    import pandas as pd

    gencode = gtfparse.read_gtf('data/gencode.v40.annotation.gtf')
    gencode = gencode.to_pandas()
    gencode.to_pickle('data/gencode.v40.annotation.pickle')

prompt = ("""
You are a helpful DNA assistant to 'User'. You do not respond as 'User' or pretend to be 'User'. You only respond once as 'Assistant'. 'System' will give you data. Do not respond as 'System'. Always explain why you do what you do with lines starting with 'Thoughts:'.
You have access to a database of genes through function calling.

Please note that the function calls will do automatic de-dupe to reduce the quantity of data to parse.

You always output a JSON, and nothing else. This will allow you to call various functions:
"""
+
"""
- search_genes_by_name: Allows you to search genes by name. You need to specify which fields you want. Example: {"function":"search_genes_by_name","query":"MT-TP","fields":["hgcn_id","gene_id","transcript_id"]}
- search_genes_by_transcript_id: Allows you to search genes by name. You need to specify which fields you want. Example: {"function":"search_genes_by_transcript_id","query":"ENSG00000210196.2","fields":["transcript_type", "transcript_name"]}
- say: Say something to the user. Example: {"function":"say","message":"Hello world"}
""" +

# df['feature'].unique()
"""
The features you can access for a gene are:
- 'gene'
- 'transcript'
- 'exon'
- 'CDS'
- 'start_codon'
- 'stop_codon'
- 'UTR'
- 'Selenocysteine'
""" +

# df['source'].unique()
"""
You have two dataset in this database: HAVANA and ENSEMBL.

""" +

# df['seqname'].unique()
"""
You have access to all chromosomes from 1 to 22, then X/Y chromosomes, and M for mitochondrial DNA. They are named chr1, ... chr22, chrX, chrX, chrM

""" + 

# df['gene_type'].unique()
"""
The available types of genes are:
- 'transcribed_unprocessed_pseudogene'
- 'unprocessed_pseudogene',
- 'miRNA'
- 'lncRNA'
- 'protein_coding'
- 'processed_pseudogene'
- 'snRNA'
- 'transcribed_processed_pseudogene'
- 'misc_RNA'
- 'TEC'
- 'transcribed_unitary_pseudogene'
- 'snoRNA'
- 'scaRNA'
- 'rRNA_pseudogene'
- 'unitary_pseudogene'
- 'polymorphic_pseudogene'
- 'pseudogene'
- 'rRNA'
- 'IG_V_pseudogene'
- 'scRNA'
- 'IG_V_gene',
- 'IG_C_gene'
- 'IG_J_gene'
- 'sRNA'
- 'ribozyme'
- 'translated_processed_pseudogene'
- 'vault_RNA'
- 'TR_C_gene'
- 'TR_J_gene'
- 'TR_V_gene'
- 'TR_V_pseudogene'
- 'translated_unprocessed_pseudogene'
- 'TR_D_gene'
- 'IG_C_pseudogene'
- 'TR_J_pseudogene'
- 'IG_J_pseudogene'
- 'IG_D_gene'
- 'IG_pseudogene'
- 'Mt_tRNA'
- 'Mt_rRNA'

""" +

# Note: exon_number has been renamed to exon_id
"""

A given line in the database contain the followwing columns:
'seqname' 'source' 'feature' 'start' 'end' 'score' 'strand' 'frame' 'gene_id' 'gene_type' 'gene_name' 'level' 'hgnc_id' 'havana_gene' 'transcript_id' 'transcript_type' 'transcript_name' 'transcript_support_level' 'tag' 'havana_transcript' 'exon_id' 'exon_id' 'ont' 'protein_id' 'ccdsid'

start/end represents the position of the sequence in the chromesome
strand contains the direction (LTR/RTL) of the gene

Here is one example of interaction:
User: What are the transcripts for the MT-TP gene ?
Thoughts: Okay the user mention the MT-TP gene, I'll look for that gene name. They want the transcripts, so I'll just select that field in the database.
Assistant: {"function","search_genes_by_name","query":"MT-TP","fields":["transcript_id", "transcript_name", "feature"]}
System: [{"feature":"exon","transcript_id":"ENST00000387461.2", "transcript_name":"MT-TP-201"}, {"feature":"transcript""transcript_id":"ENST00000387461.2", "transcript_name":"MT-TP-201"}]
Assistant: {"function":"say","message":"There is one transcript for MT-TP: ENST00000387461.2 called MT-TP-201"}

Here is another example of interaction
User: What is the name of the gene associated with transcript ENST00000450305.2
Thoughts: Okay, I just need to grab the gene_name, for gene with transcript_id ENST00000450305.2
Assistant: {"function":"search_genes_by_transcript_id","query":"ENST00000450305.2","fields":"gene_name"}
System: [{"gene_name":"DDX11L1.2","repeated":7}]
Assistant: {"function":"say","The name of the gene for that transcript is DDX11L1"}

""")

def search(query_field, query, fields):
    global gencode
    lines = gencode[gencode[query_field] == query]
    objs = {}
    for line in lines:
        o = {}
        for f in fields:
            o[f] = lines[f]
        if o in objs:
            if 'repeated' in objs[o]:
                objs[o]['repeated'] += 1
            else:
                objs[o]['repeated'] = 2

    return list(objs)

def search_genes_by_name(query, fields):
    return search('gene_name', query, fields)

def search_genes_by_transcript_id(query, fields):
    return search('transcript_id', query, fields)

max_tokens = 512
def vllm_complete(txt):
    data = {
        'model': 'microsoft/Phi-3-mini-128k-instruct',
        'prompt': prompt,
        'max_tokens': max_tokens,
        'temperature': 0.35,
    }

    headers = {'Content-Type': 'application/json'}
    data['prompt'] = prompt + txt
    response = requests.post('http://phh-abiko.local:8000/v1/completions', data=json.dumps(data), headers=headers)
    return json.loads(response.text)['choices'][0]['text']

def togetherxyz_complete(txt):
    data = {
        'model': 'meta-llama/Llama-3-70b-chat-hf',
        #'model': 'meta-llama/Llama-3-8b-chat-hf',
        'max_tokens': max_tokens,
        'stream_tokens': False,
        "stop": ["</s>", "[/INST]"],
        'temperature': 0.35,
    }

    headers = {'Content-Type': 'application/json', "Authorization": "Bearer " + TogetherXYZ}
    data['prompt'] = prompt + txt
    response = requests.post('https://api.together.xyz/inference', data=json.dumps(data), headers=headers)
    if response.status_code != 200:
        print("Failed infering", response.text)
        return "Error"
    # Wait one second after the request to avoid being rate limited
    time.sleep(1)
    # print(response.text)
    return json.loads(response.text)['output']['choices'][0]['text']


# Create a function that continues the request and make "prompt" bigger to retain context
def continue_prompt():
    global discussion
    #content = llamacpp_complete(discussion)
    #content = mistral_complete(discussion)
    #content = togetherxyz_complete(discussion)
    content = vllm_complete(discussion)
    # print(content)
    okay_lines = [line for line in content.split("\n") if
                  line.startswith('Assistant:') or line.startswith('Thoughts:') or line.startswith('System:')]
    return okay_lines

discussion = ""
if len(sys.argv) > 1:
    if sys.argv[1] == "ask":
        discussion += f"User: {sys.argv[2]}\n"

if len(discussion) == 0:
    discussion += "User: how many exons does transcript ENST00000684350.1 have\n"

lines = []
lines += continue_prompt()
while True:
    answer = None
    nextCall = None
    skip =  False
    while len(lines) > 0:
        line = lines.pop(0)
        print("RX: " + line)
        # Model is trying to predict the future, ignore
        if line.startswith("System:"):
            lines = []
            skip = True
            break

        discussion += line + "\n"
        if line.startswith("Assistant:"):
            l = line[len("Assistant:"):]
            # Sometimes the APIs send the final </s> tag, sometimes they don't
            # Remove it if it does
            if l.endswith("</s>"):
                print("Removing leading </s>")
                l = l[:-4]
            nextCall = json.loads(l)
            lines = []
            break
    if skip:
        continue
    if nextCall is None:
        print("----- Failed")
        print(discussion)
        print("----- Failed")
        sys.exit(1)

    function = nextCall['function']
    print(f"Calling function {function} {nextCall}")
    if function == 'say':
        print(f"Assistant says {nextCall['message']}")
        finished = True
    elif function == 'search_genes_by_name':
        answer = search_genes_by_name(nextCall['query'], nextCall['fields'])
    elif function == 'search_genes_by_transcript_id':
        answer = search_genes_by_transcript_id(nextCall['query'], nextCall['fields'])
    # Currently not declared in the prompt
    elif function == 'end':
        finished = True
    else:
        exception = f"Function {function} not implemented"
        print(exception)
        print(discussion)
        sys.exit(1)
    if answer is not None:
        print("TX:" + json.dumps(answer))
        discussion += f"\nSystem: {json.dumps(answer)}\n"

    # If there are no more commands, call continue_prompt to get new ones
    if len(lines) == 0 and not finished:
        lines += continue_prompt()
    if finished:
        break

# Dump the content of the discussion inside dataset/timestamp.txt
with open(f"dataset/{int(time.time())}.txt", "w") as f:
    f.write(discussion)
print("--------------------------------")
print(discussion)
