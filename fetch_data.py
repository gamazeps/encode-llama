import os
import pickle
import tempfile
import urllib

import gtfparse

def fetch_gencode(version: int = 40, data_dir: os.PathLike = 'data'):
    gencode_pickle = os.path.join(data_dir, f'gencode.v{version}.annotation.pickle')

    os.makedirs(data_dir, exist_ok=True)

    if os.path.exists(gencode_pickle):
        with open(gencode_pickle, 'rb') as f:
            return pickle.load(f)

    with tempfile.TemporaryDirectory() as tmpdir:
        print(f'Logging: gencode v{version} is not present locally, downloading it')
        gtf_path = os.path.join(tmpdir, 'gencode.gtf.gz')
        urllib.request.urlretrieve(
            f'https://ftp.ebi.ac.uk/pub/databases/gencode/Gencode_human/release_{version}/gencode.v{version}.annotation.gtf.gz',
            gtf_path
        )
        gtf = gtfparse.read_gtf(gtf_path).to_pandas()
        gtf.to_pickle(gencode_pickle)
        return gtf
