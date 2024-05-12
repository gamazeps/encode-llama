import request, { Response } from "supertest";
import { Express } from "express";

import App from "../../src/app";
import { binarySearch } from "../../src/util/geneSearch";
let app: Express | null = null;

const query = `
  query Genes($id: [String], $name: [String], $strand: String, $chromosome: String, $start: Int, $end: Int,
              $gene_type: String, $havana_id: String, $name_prefix: [String!], $limit: Int, $offset: Int, $orderby: String,
              $assembly: String!) {
    gene(id: $id, name: $name, strand: $strand, chromosome: $chromosome, start: $start, end: $end,
         gene_type: $gene_type, havana_id: $havana_id, name_prefix: $name_prefix, orderby: $orderby,
         limit: $limit, offset: $offset, assembly: $assembly) {
      id,
      name,
      strand,
      coordinates {
        chromosome,
        start,
        end
      },
      score,
      project,
      gene_type,
      havana_id
      gene_quantification(source: { type: ENCODE }, assembly: "GRCh38") {
        tpm
      }
    }
  }
`;

const queryWithTranscripts = `
  query Genes($id: [String], $name: [String], $strand: String, $chromosome: String, $start: Int, $end: Int,
              $gene_type: String, $havana_id: String, $name_prefix: [String!], $limit: Int, $offset: Int,
              $assembly: String!) {
    gene(id: $id, name: $name, strand: $strand, chromosome: $chromosome, start: $start, end: $end,
         gene_type: $gene_type, havana_id: $havana_id, name_prefix: $name_prefix,
         limit: $limit, offset: $offset, assembly: $assembly) {
      id,
      transcripts {
        id
      }
    }
  }
`;

const transcriptQuery = `
  query q {
    transcript(id: "ENST00000456328.2", assembly: "GRCh38") {
      id
    }
  }
`;

const queryWithExons = `
  query Genes($id: [String], $name: [String], $strand: String, $chromosome: String, $start: Int, $end: Int,
              $gene_type: String, $havana_id: String, $name_prefix: [String!], $limit: Int, $offset: Int,
              $assembly: String!) {
    gene(id: $id, name: $name, strand: $strand, chromosome: $chromosome, start: $start, end: $end,
         gene_type: $gene_type, havana_id: $havana_id, name_prefix: $name_prefix,
         limit: $limit, offset: $offset, assembly: $assembly) {
      id,
      transcripts {
        id, exons {
          id
        }
      }
    }
  }
`;

const queryWithUTRs = `
  query Genes($id: [String], $name: [String], $strand: String, $chromosome: String, $start: Int, $end: Int,
              $gene_type: String, $havana_id: String, $name_prefix: [String!], $limit: Int, $offset: Int,
              $assembly: String!) {
    gene(id: $id, name: $name, strand: $strand, chromosome: $chromosome, start: $start, end: $end,
         gene_type: $gene_type, havana_id: $havana_id, name_prefix: $name_prefix,
         limit: $limit, offset: $offset, assembly: $assembly) {
      id,
      transcripts {
        id, exons {
          id,
          UTRs {
            id
          }
        }
      }
    }
  }
`;

const geneAssociationQuery = `
query geneAssociation($disease: String!, $gene_id: String, $limit: Int) {
    genesAssociationsQuery(disease: $disease, gene_id: $gene_id, limit: $limit) { 
        disease
        gene_id
        gene_name
        twas_p
        twas_bonferroni
        hsq
        dge_fdr
        dge_log2fc
    }
}
`;

const singleCellBoxPlotQuery = `
query singleCellBoxPlot($disease: String!, $gene: [String], $celltype: [String], $limit: Int) {
    singleCellBoxPlotQuery(disease: $disease, gene: $gene, celltype: $celltype, limit: $limit) {
        celltype
        gene
        disease
        max
        min
        median
        firstquartile
        thirdquartile
        expr_frac
        mean_count
    }
}
`;

const nearbyGeneQuery = `
query q($limit: Int, $protein_coding: Boolean) {
    nearestGenes(
        assembly: "GRCh38",
        coordinates: [
            { chromosome: "chr1", start: 100, stop: 1000000 },
            { chromosome: "chr1", start: 1000000, stop: 2000000 },
            { chromosome: "chr1", start: 20000, stop: 30000 },
            { chromosome: "chr2", start: 201760881, stop: 201760981 }
        ]
        limit: $limit
        protein_coding: $protein_coding
    ) {
        intersecting_genes {
            name
            coordinates {
                chromosome
                start
                end
            }
        }
        start
    }
}
`;

const TEST_COORDINATES = [
    { chromosome: "chr1", position: 10000000 },
    { chromosome: "chr1", position: 10010000 },
    { chromosome: "chr1", position: 10020000 },
    { chromosome: "chr1", position: 10030000 },
    { chromosome: "chr1", position: 10040000 },
    { chromosome: "chr1", position: 10050000 }
];

const TEST_GENES = [
    { chromosome: "chr1", start: 1000000, end: 1010000 },
    { chromosome: "chr1", start: 1500000, end: 1510000 },
    { chromosome: "chr1", start: 2500000, end: 2510000 },
    { chromosome: "chr1", start: 2560000, end: 2570000 },
    { chromosome: "chr2", start: 1000000, end: 1010000 },
    { chromosome: "chr2", start: 1500000, end: 1510000 }
];

const TEST_ELEMENTS = [
    { chromosome: "chr1", start: 1000000, end: 1000100 },
    { chromosome: "chr1", start: 1500000, end: 1500100 },
    { chromosome: "chr1", start: 1500300, end: 1500400 },
    { chromosome: "chr1", start: 2560000, end: 2560050 },
    { chromosome: "chr2", start: 1000000, end: 1000100 },
    { chromosome: "chr2", start: 1500000, end: 1500100 }
];

describe("gene query", () => {
    
    beforeAll( async () => {
        app = await App;
    });

    test("should search genes", async () => {
        expect(binarySearch(TEST_COORDINATES, { chromosome: "chr1", position: 10030000 })).toBe(3);
        expect(binarySearch(TEST_COORDINATES, { chromosome: "chr1", position: 10010001 })).toBe(2);
        expect(binarySearch(TEST_COORDINATES, { chromosome: "chr1", position: 10049000 })).toBe(5);
    });

    test("should return one gene with name DDX11L1", async () => {
        const variables = {
            name: ["DDX11L1"],
            assembly: "GRCh38"
        };
        const response: Response = await request(app)
            .post("/graphql")
            .send({ query, variables });
        expect(response.status).toBe(200);
        expect(response.body.data.gene.length).toBe(1);
        expect(response.body.data.gene).toContainEqual({
            id: "ENSG00000223972.5",
            name: "DDX11L1",
            gene_quantification: [],
            coordinates: {
                chromosome: "chr1",
                start: 11869,
                end: 14409
            },
            project: "HAVANA",
            score: 0,
            strand: "+",
            gene_type: "transcribed_unprocessed_pseudogene",
            havana_id: "OTTHUMG00000000961.2"
        });
    });

    test("should return nearby genes", async () => {
        const response: Response = await request(app)
            .post("/graphql")
            .send({ query: nearbyGeneQuery, variables: {} });
        expect(response.status).toBe(200);
        expect(response.body.data.nearestGenes).toContainEqual(
            {
                intersecting_genes: [
                    { name: 'AL627309.1', coordinates: { chromosome: 'chr1', start: 89295, end: 133723 } },
                    { name: 'OR4F5', coordinates: { chromosome: 'chr1', start: 65419, end: 71585 } },
                    { name: 'OR4G11P', coordinates: { chromosome: 'chr1', start: 57598, end: 64116 } }
                ],
                start: 100
            }
        );
        expect(response.body.data.nearestGenes).toContainEqual(
            {
                intersecting_genes: [
                    { name: 'WASH7P', coordinates: { chromosome: 'chr1', start: 14404, end: 29570 } },
                    { name: 'MIR1302-2HG', coordinates: { chromosome: 'chr1', start: 29554, end: 31109 } },
                    { name: 'MIR1302-2', coordinates: { chromosome: 'chr1', start: 30366, end: 30503 } }
                ],
                start: 20000
            }
        );
        expect(response.body.data.nearestGenes).toContainEqual(
            {
                intersecting_genes: [],
                start: 201760881
            }
        );
    });

    test("should return 2 nearby genes", async () => {
        const response: Response = await request(app)
            .post("/graphql")
            .send({ query: nearbyGeneQuery, variables: { limit: 2 } });
        expect(response.status).toBe(200);
        expect(response.body.data.nearestGenes).toContainEqual(
            {
                intersecting_genes: [
                    { name: 'AL627309.1', coordinates: { chromosome: 'chr1', start: 89295, end: 133723 } },
                    { name: 'OR4F5', coordinates: { chromosome: 'chr1', start: 65419, end: 71585 } }
                ],
                start: 100
            }
        );
        expect(response.body.data.nearestGenes).toContainEqual(
            {
                intersecting_genes: [
                    { name: 'WASH7P', coordinates: { chromosome: 'chr1', start: 14404, end: 29570 } },
                    { name: 'MIR1302-2HG', coordinates: { chromosome: 'chr1', start: 29554, end: 31109 } },
                ],
                start: 20000
            }
        );
        expect(response.body.data.nearestGenes).toContainEqual(
            {
                intersecting_genes: [],
                start: 201760881
            }
        );
    });

    test("should return 2 nearby coding genes", async () => {
        const response: Response = await request(app)
            .post("/graphql")
            .send({ query: nearbyGeneQuery, variables: { limit: 2, protein_coding: true } });
        expect(response.status).toBe(200);
        expect(response.body.data.nearestGenes).toContainEqual(
            {
                intersecting_genes: [
                    { name: 'OR4F5', coordinates: { chromosome: 'chr1', start: 65419, end: 71585 } }
                ],
                start: 100
            }
        );
        expect(response.body.data.nearestGenes).toContainEqual(
            {
                intersecting_genes: [
                    { name: 'OR4F5', coordinates: { chromosome: 'chr1', start: 65419, end: 71585 } }
                ],
                start: 20000
            }
        );
        expect(response.body.data.nearestGenes).toContainEqual(
            {
                intersecting_genes: [],
                start: 201760881
            }
        );
    });

    test("should return one transcript", async () => {
        const response: Response = await request(app)
            .post("/graphql")
            .send({ query: transcriptQuery });
        expect(response.status).toBe(200);
        expect(response.body.data.transcript.length).toBe(1);
        expect(response.body.data.transcript).toContainEqual({
            id: "ENST00000456328.2",
        });
    });

    test("should return gene with name DDX11L1", async () => {
        const variables = {
            name_prefix: "DDX11L1",
            assembly: "GRCh38",
            orderby: "name"
        };
        const response: Response = await request(app)
            .post("/graphql")
            .send({ query, variables });
        expect(response.status).toBe(200);
        expect(response.body.data.gene.length).toBe(1);
        expect(response.body.data.gene).toContainEqual({
            id: "ENSG00000223972.5",
            name: "DDX11L1",
            gene_quantification: [],
            coordinates: {
                chromosome: "chr1",
                start: 11869,
                end: 14409
            },
            project: "HAVANA",
            score: 0,
            strand: "+",
            gene_type: "transcribed_unprocessed_pseudogene",
            havana_id: "OTTHUMG00000000961.2"
        });
    });
    test("should return two transcripts for DDX11L1", async () => {
        const variables = {
            name: ["DDX11L1"],
            assembly: "GRCh38"
        };
        const response: Response = await request(app)
            .post("/graphql")
            .send({
                query: queryWithTranscripts,
                variables
            });
        expect(response.status).toBe(200);
        expect(response.body.data.gene.length).toBe(1);
        expect(response.body.data.gene).toContainEqual({
            id: "ENSG00000223972.5",
            transcripts: [{ id: "ENST00000456328.2" }, { id: "ENST00000450305.2" }]
        });
    });

    test("should return 11 exons for 1 transcript for WASH7P", async () => {
        const variables = {
            name: ["WASH7P"],
            assembly: "GRCh38"
        };
        const response: Response = await request(app)
            .post("/graphql")
            .send({
                query: queryWithExons,
                variables
            });
        expect(response.status).toBe(200);
        expect(response.body.data.gene.length).toBe(1);
        expect(response.body.data.gene).toContainEqual({
            id: "ENSG00000227232.5",
            transcripts: [
                {
                    exons: [
                        { id: "exon:ENST00000488147.1:1" },
                        { id: "exon:ENST00000488147.1:2" },
                        { id: "exon:ENST00000488147.1:3" },
                        { id: "exon:ENST00000488147.1:4" },
                        { id: "exon:ENST00000488147.1:5" },
                        { id: "exon:ENST00000488147.1:6" },
                        { id: "exon:ENST00000488147.1:7" },
                        { id: "exon:ENST00000488147.1:8" },
                        { id: "exon:ENST00000488147.1:9" },
                        { id: "exon:ENST00000488147.1:10" },
                        { id: "exon:ENST00000488147.1:11" }
                    ],
                    id: "ENST00000488147.1"
                }
            ]
        });
    });

    test("should return 2 transcripts with UTRs for OR4F5", async () => {
        const variables = {
            name: ["OR4F5"],
            assembly: "GRCh38"
        };
        const response: Response = await request(app)
            .post("/graphql")
            .send({
                query: queryWithUTRs,
                variables
            });
        expect(response.status).toBe(200);
        expect(response.body.data.gene.length).toBe(1);
        expect(response.body.data.gene).toContainEqual({
            id: "ENSG00000186092.6",
            transcripts: [
                {
                    exons: [
                        {
                            UTRs: [{ id: "UTR5:ENST00000641515.2" }, { id: "UTR5:ENST00000641515.2" }],
                            id: "exon:ENST00000641515.2:1"
                        },
                        {
                            UTRs: [{ id: "UTR5:ENST00000641515.2" }],
                            id: "exon:ENST00000641515.2:2"
                        },
                        {
                            UTRs: [{ id: "UTR3:ENST00000641515.2" }],
                            id: "exon:ENST00000641515.2:3"
                        }
                    ],
                    id: "ENST00000641515.2"
                },
                {
                    exons: [
                        {
                            UTRs: [
                                { id: "UTR3:ENST00000335137.4" },
                                { id: "UTR3:ENST00000335137.4" },
                                { id: "UTR5:ENST00000335137.4" },
                                { id: "UTR5:ENST00000335137.4" }
                            ],
                            id: "exon:ENST00000335137.4:1"
                        },
                        {
                            UTRs: [
                                { id: "UTR3:ENST00000335137.4" },
                                { id: "UTR3:ENST00000335137.4" },
                                { id: "UTR5:ENST00000335137.4" },
                                { id: "UTR5:ENST00000335137.4" }
                            ],
                            id: "exon:ENST00000335137.4:1"
                        }
                    ],
                    id: "ENST00000335137.4"
                }
            ]
        });
    });

    test("should return two transcripts for DDX11L1 and one for WASH7P", async () => {
        const variables = {
            name: ["DDX11L1", "WASH7P"],
            assembly: "GRCh38"
        };
        const response: Response = await request(app)
            .post("/graphql")
            .send({
                query: queryWithTranscripts,
                variables
            });
        expect(response.status).toBe(200);
        expect(response.body.data.gene.length).toBe(2);
        expect(response.body.data.gene).toContainEqual({
            id: "ENSG00000223972.5",
            transcripts: [{ id: "ENST00000456328.2" }, { id: "ENST00000450305.2" }]
        });
        expect(response.body.data.gene).toContainEqual({
            id: "ENSG00000227232.5",
            transcripts: [{ id: "ENST00000488147.1" }]
        });
    });

    test("should select one gene", async () => {
        const variables = {
            chromosome: "chr1",
            start: 60000,
            end: 65000,
            assembly: "GRCh38"
        };
        const response: Response = await request(app)
            .post("/graphql")
            .send({ query, variables });
        expect(response.status).toBe(200);
        expect(response.body.data.gene.length).toBe(1);
        expect(response.body.data.gene).toContainEqual({
            id: "ENSG00000240361.2",
            name: "OR4G11P",
            coordinates: {
                chromosome: "chr1",
                start: 57598,
                end: 64116
            },
            gene_quantification: [],
            project: "HAVANA",
            score: 0,
            strand: "+",
            gene_type: "transcribed_unprocessed_pseudogene",
            havana_id: "OTTHUMG00000001095.3"
        });
    });

    test("should select one gene", async () => {
        const variables = {
            id: "ENSG00000000460.16",
            assembly: "GRCh38"
        };
        const response: Response = await request(app)
            .post("/graphql")
            .send({ query, variables });
        expect(response.status).toBe(200);
        expect(response.body.data.gene.length).toBe(1);
        expect(response.body.data.gene).toContainEqual({
            coordinates: {
                chromosome: "chr1",
                end: 14409,
                start: 11869
            },
            gene_quantification: [{ tpm: 7.54 }],
            gene_type: "transcribed_unprocessed_pseudogene",
            havana_id: "OTTHUMG00000000961.3",
            id: "ENSG00000000460.16",
            name: "DSX11L2",
            project: "HAVANA",
            score: 0,
            strand: "+"
        });
    });

    test("should return genes associations for given disease and gene id", async () => {
        const variables = {
            disease: "Autism", gene_id: "ENSG00000000457"
        };
        const response: Response = await request(app).post("/graphql").send({ query: geneAssociationQuery, variables });
        expect(response.status).toBe(200);
        expect(response.body.data.genesAssociationsQuery.length).toBe(1);       
        expect(response.body.data.genesAssociationsQuery).toContainEqual({
           dge_log2fc: -0.094800595, gene_name: "SCYL3",gene_id: "ENSG00000000457", twas_p: 0.44, disease: "Autism", twas_bonferroni: 1, hsq: 0.0375, dge_fdr: 0.112475859

        });
    });

    test("should return genes associations for given disease", async () => {
        const variables = {
            disease: "Autism"
        };
        const response: Response = await request(app).post("/graphql").send({ query: geneAssociationQuery, variables });
        expect(response.status).toBe(200);
        expect(response.body.data.genesAssociationsQuery.length).toBe(25);       
        
    });

    test("should return single cell box plot for given disease, gene, celltype", async () => {
        const variables = { disease: "Urban-DLPFC", gene:["AL627309.1"], celltype:["Pvalb"] }
        const response: Response = await request(app).post("/graphql").send({ query: singleCellBoxPlotQuery, variables });
        expect(response.status).toBe(200);
        expect(response.body.data.singleCellBoxPlotQuery.length).toBe(1);       
        
    });



});