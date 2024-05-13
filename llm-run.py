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

from absl import app
from absl import flags

FLAGS = flags.FLAGS
flags.DEFINE_enum('backend', 'vllm', ['vllm', 'togetherXYZ'], 'Provider for the LLM API')
flags.DEFINE_integer('max_tokens', 512,
                     'Maximum number of tokens the model should generate per query')
flags.DEFINE_string('query', None, 'User query')
flags.DEFINE_enum('debug', 'high', ['high', 'low'], 'Should we display API queries')

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
- count_of_type: Count the number of rows of given feature matching the request. The list of features is described in [1]. Specify `transcript_id` or `gene_name` field in the request. Example: {"function":"count_of_type","transcript_id":"ENSG00000210196.2", "type":"gene"} or {"function":"count_of_type","gene_name":"MT-TP", "type":"start_codon"}
- say: Say something to the user. Example: {"function":"say","message":"Hello world"}
""" +

# df['feature'].unique()
"""
The features you can access for a gene are [1]:
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

"""

A given line in the database contain the followwing columns:
'seqname' 'source' 'feature' 'start' 'end' 'score' 'strand' 'frame' 'gene_id' 'gene_type' 'gene_name' 'level' 'hgnc_id' 'havana_gene' 'transcript_id' 'transcript_type' 'transcript_name' 'transcript_support_level' 'tag' 'havana_transcript' 'exon_number' 'exon_id' 'ont' 'protein_id' 'ccdsid'

start/end represents the position of the sequence in the chromesome
strand contains the direction (LTR/RTL) of the gene
exon_number is an id of the exon within a gene

Mistakes are perfectly normal and expected.
If you made a mistake, understand which mistake you made. And then try to fix it. Remember to explain your mistakes in Thoughts:

Here is one example of interaction:
User: What are the transcripts for the MT-TP gene ?
Thoughts: Okay the user mention the MT-TP gene, I'll look for that gene name. They want the transcripts, so I'll just select that field in the database.
Assistant: {"function":"search_genes_by_name","query":"MT-TP","fields":["transcript_id", "transcript_name", "feature"]}
System: [{"feature":"exon","transcript_id":"ENST00000387461.2", "transcript_name":"MT-TP-201"}, {"feature":"transcript""transcript_id":"ENST00000387461.2", "transcript_name":"MT-TP-201"}]
Assistant: {"function":"say","message":"There is one transcript for MT-TP: ENST00000387461.2 called MT-TP-201"}

Here is another example of interaction
User: What is the name of the gene associated with transcript ENST00000450305.2
Thoughts: Okay, I just need to grab the gene_name, for gene with transcript_id ENST00000450305.2
Assistant: {"function":"search_genes_by_transcript_id","query":"ENST00000450305.2","fields":["gene_name"]}
System: [{"gene_name":"DDX11L1.2","repeated":7}]
Assistant: {"function":"say","message":"The name of the gene for that transcript is DDX11L1"}

""")


def search(query_field, query, fields):
    global gencode
    lines = gencode[gencode[query_field] == query]
    ret = []
    for index, row in lines.iterrows():
        o = {}
        for f in fields:
            o[f] = row[f]
        ret += [o]

    ret_json = json.dumps(ret)
    if len(ret_json) > 4000:
        return "Result too big. Either call count, or do a better filter"
    return ret


def search_genes_by_name(query, fields):
    return search('gene_name', query, fields)


def search_genes_by_transcript_id(query, fields):
    return search('transcript_id', query, fields)


def count_of_type(t, transcript_id, gene_name):
    global gencode
    lines = gencode
    if transcript_id is not None:
        lines  = lines[lines['transcript_id'] == transcript_id]
    if gene_name is not None:
        lines  = lines[lines['gene_name'] == gene_name]
    key = None
    if t == 'exon':
        key = 'exon_id'
    if t == 'start_codon' or t == "end_codon" or t == "CDS":
        key = 'start'
    features = lines['feature'].unique()
    if not t in features:
        if'codon' in t:
            return f"This feature '{t}' doesn't exist. Did you mean start_codon?"
        return f"This kind of feature '{t}' doesn't exist"
    lines = lines[lines['feature'] == t]
    if key is None:
        return len(lines)
    return len(lines[key].unique())


# Launching vllm on RTX3090 with
# python -m vllm.entrypoints.openai.api_server --model microsoft/Phi-3-mini-128k-instruct --dtype auto --trust-remote-code --gpu-memory-utilization 0.85 --max-model-len 25000
def vllm_complete(txt, max_tokens):
    data = {
        'model': 'microsoft/Phi-3-mini-128k-instruct',
        'prompt': prompt,
        'max_tokens': max_tokens,
        'temperature': 0.20,
    }

    headers = {'Content-Type': 'application/json'}
    data['prompt'] = prompt + txt
    response = requests.post('http://phh-abiko.local:8000/v1/completions', data=json.dumps(data), headers=headers)
    return json.loads(response.text)['choices'][0]['text']


# You may need to create an account on https://api.together.ai/, and copy your API key in tokens/together
def togetherxyz_complete(txt, max_tokens, api_key):
    data = {
        'model': 'meta-llama/Llama-3-8b-chat-hf',
        'max_tokens': max_tokens,
        'stream_tokens': False,
        "stop": ["</s>", "[/INST]"],
        'temperature': 0.35,
    }

    headers = {'Content-Type': 'application/json', "Authorization": f'Bearer {api_key}'}
    data['prompt'] = prompt + txt
    response = requests.post('https://api.together.xyz/inference', data=json.dumps(data), headers=headers)
    if response.status_code != 200:
        print("Failed infering", response.text)
        return "Error"
    # Wait one second after the request to avoid being rate limited
    time.sleep(1)
    return json.loads(response.text)['output']['choices'][0]['text']


try:
    with open('data/gencode.v40.annotation.pickle', 'rb') as f:
        gencode = pickle.load(f)
except:
    import gtfparse
    import pandas as pd

    gencode = gtfparse.read_gtf('data/gencode.v40.annotation.gtf')
    gencode = gencode.to_pandas()
    gencode.to_pickle('data/gencode.v40.annotation.pickle')



# Create a function that continues the request and make "prompt" bigger to retain context
def continue_prompt(discussion, backend, max_tokens=512):
    if backend == 'togetherXYZ':
        # would need to have a lambda that would be cleaner
        with open('tokens/together', 'r') as f:
            api_key = f.readline().strip()
        content = togetherxyz_complete(discussion, max_tokens, api_key)
    elif backend == 'vllm':
        content = vllm_complete(discussion, max_tokens)
    else:
        raise ValueError(f'{backend} is not in the list of supported backends')

    okay_lines = [line for line in content.split("\n") if
                  line.startswith('Assistant:') or line.startswith('Thoughts:') or line.startswith('System:')]
    return okay_lines


def main(argv):
    del argv  # Unused.

    if FLAGS.query:
        discussion = f"User: {FLAGS.query}\n"
    else:
        discussion = "User: how many exons does transcript ENST00000684350.1 have\n"

    lines = []
    lines += continue_prompt(discussion, FLAGS.backend, FLAGS.max_tokens)
    while True:
        answer = None
        nextCall = None
        skip =  False
        finished = False
        while len(lines) > 0:
            line = lines.pop(0)
            if FLAGS.debug == 'high':
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
                    if FLAGS.debug == 'high':
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
        if FLAGS.debug == 'high':
            print(f"Calling function {function} {nextCall}")

        if function == 'say':
            print(f"Assistant says {nextCall['message']}")
            finished = True
        elif function == 'search_genes_by_name':
            answer = search_genes_by_name(nextCall['query'], nextCall['fields'])
        elif function == 'search_genes_by_transcript_id':
            answer = search_genes_by_transcript_id(nextCall['query'], nextCall['fields'])
        elif function == 'count_of_type':
            transcript_id = None
            gene_name = None
            wrong_keys = [key for key in nextCall.keys() if key not in {"transcript_id", "gene_name", "function", "type"}]
            if wrong_keys:
                answer = f"Unexpected keys {wrong_keys}"
            else:
                if 'transcript_id' in nextCall:
                    transcript_id = nextCall['transcript_id']
                if 'gene_name' in nextCall:
                    gene_name = nextCall['gene_name']
                t = nextCall['type']
                answer = count_of_type(t, transcript_id, gene_name)
        # Currently not declared in the prompt
        elif function == 'end':
            finished = True
        else:
            exception = f"Function {function} not implemented"
            print(exception)
            print(discussion)
            sys.exit(1)
        if answer is not None:
            if FLAGS.debug == 'high':
                print("TX:" + json.dumps(answer))
            discussion += f"\nSystem: {json.dumps(answer)}\n"

        # If there are no more commands, call continue_prompt to get new ones
        if len(lines) == 0 and not finished:
            lines += continue_prompt(discussion, FLAGS.backend, FLAGS.max_tokens)
        if finished:
            break

    # Dump the content of the discussion inside dataset/timestamp.txt
    with open(f"dataset/{int(time.time())}.txt", "w") as f:
        f.write(discussion)
    print("--------------------------------")
    print(discussion)


if __name__ == '__main__':
    app.run(main)
