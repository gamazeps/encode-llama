#!/bin/bash

export POSTGRES_USER=postgres
export POSTGRES_HOST=localhost
export POSTGRES_DB=postgres
export POSTGRES_PORT=5555
export POSTGRES_SCHEMA=ccre_test
export MATRICES=grch38\=http://localhost:8887/GRCh38.rDHS-matrix.npy
export MATRIX_CHUNK_SIZE=100000
export UMAP_MATRICES=grch38\=dnase\=http://localhost:8887/umap.test.npy
export PCA_MATRICES=grch38\=dnase\=http://localhost:8887/biosamples.pca.npy\=http://localhost:8887/elements.pca.npy
export GTEX_DECORATIONS=grch38\=http://localhost:8887/cCRE_decoration.text.matrix
export LDR_MATRIX=http://localhost:8887/GWAS.test.npy
export LDR_BIOSAMPLES=http://localhost:8887/GWAS.samples.test.txt
export LDR_STUDIES=http://localhost:8887/GWAS.studies.test.txt
export SEQUENCE_READERS=grch38\=http://localhost:8887/hg38.chr22.2bit
