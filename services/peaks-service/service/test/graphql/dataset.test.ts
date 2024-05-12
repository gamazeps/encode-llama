import request, { Response } from "supertest";

import app from "../../src/app";

const query = `
  query Datasets($species: String, $lab: String, $project: String, $source: String,
                 $target: String, $biosample: String, $accession: [String], $developmental_slims: [String]) {
    peakDataset(species: $species, lab: $lab, project: $project, source: $source,
            target: $target, biosample: $biosample, accession: $accession, developmental_slims: $developmental_slims) {
      datasets {
        accession, target, released, project, biosample, species, developmental_slims,
        cell_slims,
        organ_slims,
        system_slims,
        lab {
          name,
          friendly_name
        }
      }
    }
  }
`;

const querywithcounts = `
  query Datasets($species: String, $lab: String, $project: String, $source: String,
                 $target: String, $biosample: String, $accession: [String]) {
    peakDataset(species: $species, lab: $lab, project: $project, source: $source,
            target: $target, biosample: $biosample, accession: $accession) {
      datasets {
        accession
      },
      counts {
        total, targets, biosamples, species, projects, labs
      }
    }
  }
`;

const querywithfiles = `
  query Datasets($species: String, $lab: String, $project: String, $target: String, $biosample: String, $assembly: String, $accession: [String]) {
    peakDataset(species: $species, lab: $lab, project: $project, target: $target, biosample: $biosample, processed_assembly: $assembly, accession: $accession) {
      datasets {
        accession, target, released, project, biosample, species
        lab {
          name,
          friendly_name
        },
        sequence_reads: files(types: "sequence_reads") {
          accession
          ... on SequenceReads {
            paired_end, read_id, biorep, techrep, url
          }
        }
        normalized_signal: files(types: "normalized_signal", assembly: $assembly) {
            accession
            ... on NormalizedSignal {            
                biorep, techrep, url
            }
        }
        replicated_peaks: files(types: "replicated_peaks", assembly: $assembly) {
          accession
          ... on ReplicatedPeaks {
            assembly {
              name, species
            },
            url
          }
        }
        bigbed_replicated_peaks: files(types: "bigbed_replicated_peaks", assembly: $assembly) {
            accession
            ... on BigBedReplicatedPeaks {
              assembly {
                name, species
              },
              url
            }
        }
        bigbed_unreplicated_peaks: files(types: "bigbed_unreplicated_peaks", assembly: $assembly) {
            accession
            ... on BigBedUnreplicatedPeaks {
              assembly {
                name, species
              },
              url,
              biorep,
              techrep
            }
        }
        
      }
    }
  }
`;

const querynoassembly = `
query {
    peakDataset {
      datasets {
        accession
        target
        sequence_reads: files(types: "sequence_reads") {
          accession
        }
      }
      counts {
        total
      }
    }
  }
`;

const querytwoassembly = `
query {
    GRCh38: peakDataset(processed_assembly: "GRCh38") {
      datasets {
        accession
        target
        replicated_peaks: files(types: "replicated_peaks", assembly: "GRCh38") {
          accession
        }
      }
      counts {
        total
      }
    }
    hg19: peakDataset(processed_assembly: "hg19") {
        datasets {
          accession
          target
          replicated_peaks: files(types: "replicated_peaks", assembly: "hg19") {
            accession
          }
        }
        counts {
          total
        }
      }
  }
`;

describe("dataset query", () => {
    test("can return all datasets", async () => {
        const variables = {};
        const response: Response = await request(app)
            .post("/graphql")
            .send({ query: querywithcounts, variables });
        expect(response.status).toBe(200);
        expect(response.body.data.peakDataset.datasets.length).toBe(7);
        expect(response.body.data.peakDataset.datasets).toContainEqual({ accession: "ENCSR428BSK" });
        expect(response.body.data.peakDataset.datasets).toContainEqual({ accession: "ENCSR411SUC" });
        expect(response.body.data.peakDataset.datasets).toContainEqual({ accession: "ENCSR933MHJ" });
        expect(response.body.data.peakDataset.datasets).toContainEqual({ accession: "ENCSR160ZLP" });
        expect(response.body.data.peakDataset.datasets).toContainEqual({ accession: "ENCSR841NDX" });
        expect(response.body.data.peakDataset.datasets).toContainEqual({ accession: "ENCSR502NRF" });
        expect(response.body.data.peakDataset.datasets).toContainEqual({ accession: "ENCSR150EFU" });
        expect(response.body.data.peakDataset.counts).toEqual({
            total: 7,
            targets: 4,
            biosamples: 6,
            species: 2,
            projects: 2,
            labs: 4
        });
    });

    describe("can return datasets given filters", () => {
        describe("can return datasets by accession", () => {
            test("when the accession exists", async () => {
                const variables = { accession: ["ENCSR411SUC"] };
                const response: Response = await request(app)
                    .post("/graphql")
                    .send({ query, variables });
                expect(response.status).toBe(200);
                expect(response.body.data.peakDataset.datasets.length).toBe(1);
                expect(response.body.data.peakDataset.datasets).toContainEqual({
                    accession: "ENCSR411SUC",
                    cell_slims: [],
                    developmental_slims: ["endoderm"],
                    organ_slims: ["stomach"],
                    system_slims: ["digestive system"],
                    biosample: "stomach",
                    lab: {
                        friendly_name: "Richard Myers",
                        name: "richard-myers"
                    },
                    project: "ENCODE",
                    released: null,
                    species: "Homo sapiens",
                    target: "EP300"
                });
            });

            test("not when the accession doesn't exist", async () => {
                const variables = { accession: ["ENCSR000AAA"] };
                const response: Response = await request(app)
                    .post("/graphql")
                    .send({ query, variables });
                expect(response.status).toBe(200);
                expect(response.body.data.peakDataset.datasets.length).toBe(0);
            });
        });


        describe("can return datasets by dev slims", () => {
            test("when developmental slims exists", async () => {
                const variables = { developmental_slims: ["endoderm"] };
                const response: Response = await request(app)
                    .post("/graphql")
                    .send({ query, variables });
                expect(response.status).toBe(200);
                expect(response.body.data.peakDataset.datasets.length).toBe(3);
                expect(response.body.data.peakDataset.datasets).toContainEqual({
                    accession: "ENCSR411SUC",
                    cell_slims: [],
                    developmental_slims: ["endoderm"],
                    organ_slims: ["stomach"],
                    system_slims: ["digestive system"],
                    biosample: "stomach",
                    lab: {
                        friendly_name: "Richard Myers",
                        name: "richard-myers"
                    },
                    project: "ENCODE",
                    released: null,
                    species: "Homo sapiens",
                    target: "EP300"
                });
            });
            test("when developmental slims does not exists", async () => {
                const variables = { developmental_slims: ["mesoderm"] };
                const response: Response = await request(app)
                    .post("/graphql")
                    .send({ query, variables });
                expect(response.status).toBe(200);
                expect(response.body.data.peakDataset.datasets.length).toBe(0);
            })

        })
    });

    test("can return datasets from a specific project", async () => {
        const variables = { project: "ENCODE" };
        const response: Response = await request(app)
            .post("/graphql")
            .send({ query: querywithcounts, variables });
        expect(response.status).toBe(200);
        expect(response.body.data.peakDataset.datasets.length).toBe(6);
        expect(response.body.data.peakDataset.datasets).toContainEqual({ accession: "ENCSR428BSK" });
        expect(response.body.data.peakDataset.datasets).toContainEqual({ accession: "ENCSR411SUC" });
        expect(response.body.data.peakDataset.datasets).toContainEqual({ accession: "ENCSR933MHJ" });
        expect(response.body.data.peakDataset.datasets).toContainEqual({ accession: "ENCSR160ZLP" });
        expect(response.body.data.peakDataset.datasets).toContainEqual({ accession: "ENCSR841NDX" });
        expect(response.body.data.peakDataset.datasets).toContainEqual({ accession: "ENCSR502NRF" });
        expect(response.body.data.peakDataset.counts).toEqual({
            total: 6,
            targets: 3,
            biosamples: 6,
            species: 2,
            projects: 1,
            labs: 3
        });
    });

    describe("can return datasets from a specific source", () => {
        test("when the source is there", async () => {
            const variables = { source: "ENCODE" };
            const response: Response = await request(app)
                .post("/graphql")
                .send({ query, variables });
            expect(response.status).toBe(200);
            expect(response.body.data.peakDataset.datasets.length).toBe(7);
        });

        test("not when the source is not there", async () => {
            const variables = { source: "Cistrome" };
            const response: Response = await request(app)
                .post("/graphql")
                .send({ query, variables });
            expect(response.status).toBe(200);
            expect(response.body.data.peakDataset.datasets.length).toBe(0);
        });
    });

    describe("can return datasets with a specific target", () => {
        test("when the target is there", async () => {
            const variables = { target: "ELF1" };
            const response: Response = await request(app)
                .post("/graphql")
                .send({ query, variables });
            expect(response.status).toBe(200);
            expect(response.body.data.peakDataset.datasets.length).toBe(2);
        });

        test("not when the target is not there", async () => {
            const variables = { target: "CTCF" };
            const response: Response = await request(app)
                .post("/graphql")
                .send({ query, variables });
            expect(response.status).toBe(200);
            expect(response.body.data.peakDataset.datasets.length).toBe(0);
        });
    });

    describe("can return datasets from a specific lab", () => {
        test("when the lab is there, with name", async () => {
            const variables = { lab: "bradley-bernstein" };
            const response: Response = await request(app)
                .post("/graphql")
                .send({ query, variables });
            expect(response.status).toBe(200);
            expect(response.body.data.peakDataset.datasets.length).toBe(2);
        });

        test("when the lab is there, with friendly name", async () => {
            const variables = { lab: "Bradley Bernstein" };
            const response: Response = await request(app)
                .post("/graphql")
                .send({ query, variables });
            expect(response.status).toBe(200);
            expect(response.body.data.peakDataset.datasets.length).toBe(2);
        });

        test("not when the lab is not there", async () => {
            const variables = { lab: "zhiping-weng" };
            const response: Response = await request(app)
                .post("/graphql")
                .send({ query, variables });
            expect(response.status).toBe(200);
            expect(response.body.data.peakDataset.datasets.length).toBe(0);
        });
    });

    describe("can return datasets for a specific biosample", () => {
        test("when the biosample is there", async () => {
            const variables = { biosample: "stomach" };
            const response: Response = await request(app)
                .post("/graphql")
                .send({ query, variables });
            expect(response.status).toBe(200);
            expect(response.body.data.peakDataset.datasets.length).toBe(1);
        });

        test("not when the biosample is not there", async () => {
            const variables = { biosample: "heart" };
            const response: Response = await request(app)
                .post("/graphql")
                .send({ query, variables });
            expect(response.status).toBe(200);
            expect(response.body.data.peakDataset.datasets.length).toBe(0);
        });
    });

    describe("can return datasets processed with a given assembly", () => {
        test("when there are files processed with the assembly and test url field of normalized signal",async ()=>{
            const variables = { project: "ENCODE", assembly: "GRCh38" };
            const response: Response = await request(app)
            .post("/graphql")
            .send({ query: querywithfiles, variables });
            expect(response.status).toBe(200);
            
            expect(response.body.data.peakDataset.datasets.length).toBe(5);
            expect(response.body.data.peakDataset.datasets[2].normalized_signal[0].url).toEqual("https://encode-files.s3.amazonaws.com/2017/03/14/67605974-2244-4272-abe5-6eb90794f25a/ENCFF825WLX.bigWig")
        })
        test("when there bigbed unreplicated files processed with the assembly", async () => {
            const variables = { project: "ENCODE", assembly: "GRCh38", accession: ["ENCSR411SUC"] };
            const response: Response = await request(app)
                .post("/graphql")
                .send({ query: querywithfiles, variables });
            expect(response.status).toBe(200);
            expect(response.body.data.peakDataset.datasets.length).toBe(1);            
            expect(response.body.data.peakDataset.datasets).toContainEqual({
                accession: "ENCSR411SUC",
                bigbed_replicated_peaks: [],
                bigbed_unreplicated_peaks: [
                  {
                    accession: "ENCFF102MNZ",
                    assembly: {
                      name: "GRCh38",
                      species: "Homo sapiens"
                    },
                    biorep: 1,
                    techrep: 1,
                    url: "https://encode-files.s3.amazonaws.com/2017/06/15/866cda6f-3cce-45aa-87c6-33d42832a56f/ENCFF102MNZ.bigBed"
                  }
                ],
                biosample: "stomach",
                lab: {
                  friendly_name: "Richard Myers",
                  name: "richard-myers"
                },
                normalized_signal: [],
                project: "ENCODE",
                released: null,
                replicated_peaks: [],
                sequence_reads: [
                  {
                    accession: "ENCFF261LMZ",
                    biorep: 1,
                    paired_end: false,
                    read_id: 0,
                    techrep: 1,
                    url: "https://encode-files.s3.amazonaws.com/2016/10/31/e16b5d11-0895-4c89-b6f8-b1b720b32f49/ENCFF261LMZ.fastq.gz"
                  },
                  {
                    accession: "ENCFF663HBG",
                    biorep: 1,
                    paired_end: false,
                    read_id: 0,
                    techrep: 1,
                    url: "https://encode-files.s3.amazonaws.com/2016/10/31/321fead4-7e29-428c-85ff-7220e32b1cef/ENCFF663HBG.fastq.gz"
                  }
                ],
                species: "Homo sapiens",
                target: "EP300"
              });
        })

        test("when there are files processed with the assembly", async () => {
            const variables = { project: "ENCODE", assembly: "mm10" };
            const response: Response = await request(app)
                .post("/graphql")
                .send({ query: querywithfiles, variables });
            expect(response.status).toBe(200);
            expect(response.body.data.peakDataset.datasets.length).toBe(1);            
            expect(response.body.data.peakDataset.datasets).toContainEqual({
                accession: "ENCSR428BSK",
                biosample: "G1E-ER4",
                bigbed_unreplicated_peaks: [],
                bigbed_replicated_peaks: [
                    {
                      accession: "ENCFF315LKF",
                      assembly: {
                        name: "mm10",
                        species: "Mus musculus"
                      },
                      url: "https://encode-files.s3.amazonaws.com/2017/05/11/eb36527b-5023-4556-9024-05ea9fc1d9e0/ENCFF315LKF.bigBed"
                    }
                  ],
                replicated_peaks: [{ accession: "ENCFF142ZIU", assembly: { name: "mm10", species: "Mus musculus" }, url: "https://encode-files.s3.amazonaws.com/2017/05/11/dd8426ee-86ac-4c72-9345-bb9eda7650ef/ENCFF142ZIU.bed.gz" }],
                sequence_reads: [
                    {
                        accession: "ENCFF583HWE",
                        biorep: 2,
                        paired_end: false,
                        read_id: 0,
                        techrep: 1,
                        url: "https://encode-files.s3.amazonaws.com/2015/10/09/06d4c71a-d160-4059-b112-1320c54cfed2/ENCFF583HWE.fastq.gz"
                    },
                    {
                        accession: "ENCFF455RDD",
                        biorep: 1,
                        paired_end: false,
                        read_id: 0,
                        techrep: 1,
                        url: "https://encode-files.s3.amazonaws.com/2015/10/09/0af22478-097a-4811-bbe0-e9cf98fba206/ENCFF455RDD.fastq.gz"
                    }
                ],
                lab: {
                    friendly_name: "Richard Myers",
                    name: "richard-myers"
                },
                "normalized_signal": [],
                project: "ENCODE",
                released: "2016-03-30",
                species: "Mus musculus",
                target: null
            });
        });

        test("not when there are no files processed with the assembly", async () => {
            const variables = { project: "ENCODE", assembly: "mm19" };
            const response: Response = await request(app)
                .post("/graphql")
                .send({ query: querywithfiles, variables });
            expect(response.status).toBe(200);
            expect(response.body.data.peakDataset.datasets.length).toBe(0);
        });

        test("can filter on different processed assemblies, separately", async () => {
            const response: Response = await request(app)
                .post("/graphql")
                .send({ query: querytwoassembly });
            expect(response.status).toBe(200);
            expect(response.body.data["GRCh38"].datasets.length).toEqual(6);
            expect(response.body.data["GRCh38"].datasets).toContainEqual({
                accession: "ENCSR160ZLP",
                replicated_peaks: [{ accession: "ENCFF342EEV" }],
                target: "KDM5A"
            });
            expect(response.body.data["GRCh38"].datasets).toContainEqual({ accession: "ENCSR150EFU", replicated_peaks: [], target: "SMC3" });
            expect(response.body.data["GRCh38"].datasets).toContainEqual({
                accession: "ENCSR841NDX",
                replicated_peaks: [{ accession: "ENCFF948CPI" }],
                target: "ELF1"
            });
            expect(response.body.data["GRCh38"].datasets).toContainEqual({
                accession: "ENCSR502NRF",
                replicated_peaks: [{ accession: "ENCFF020UCD" }],
                target: "ELF1"
            });
            expect(response.body.data["hg19"].datasets.length).toEqual(5);
            expect(response.body.data["hg19"].datasets).toContainEqual({
                accession: "ENCSR160ZLP",
                replicated_peaks: [{ accession: "ENCFF583YFS" }],
                target: "KDM5A"
            });
            expect(response.body.data["hg19"].datasets).toContainEqual({
                accession: "ENCSR841NDX",
                replicated_peaks: [{ accession: "ENCFF807AKG" }],
                target: "ELF1"
            });
            expect(response.body.data["hg19"].datasets).toContainEqual({
                accession: "ENCSR502NRF",
                replicated_peaks: [{ accession: "ENCFF386TTQ" }],
                target: "ELF1"
            });
        });
    });

    describe("can return the files for a dataset", () => {
        test("should not require assembly for sequence reads of all datasets", async () => {
            const response: Response = await request(app)
                .post("/graphql")
                .send({ query: querynoassembly });
            expect(response.status).toBe(200);
            expect(response.body.data.peakDataset.datasets.length).toEqual(7);
        });
    });

    describe("can partition dataset collections", () => {
        test("can partition by biosample", async () => {
            const partitionBiosample = `
query {
    peakDataset {
        partitionByBiosample {
            biosample {
                name
            }
            counts {
                total
                targets
                biosamples
                species
                projects
                labs
            }
            datasets {
                accession
                biosample
                target
                lab {
                    name
                }
            }
        }
    }
}
            `;
            const response: Response = await request(app)
                .post("/graphql")
                .send({ query: partitionBiosample });
            expect(response.status).toBe(200);
            expect(response.body.data.peakDataset.partitionByBiosample).toEqual([
                {
                    biosample: { name: "G1E-ER4" },
                    counts: { biosamples: 1, labs: 1, projects: 1, species: 1, targets: 0, total: 1 },
                    datasets: [{ accession: "ENCSR428BSK", biosample: "G1E-ER4", lab: { name: "richard-myers" }, target: null }]
                },
                {
                    biosample: { name: "stomach" },
                    counts: { biosamples: 1, labs: 1, projects: 1, species: 1, targets: 1, total: 1 },
                    datasets: [{ accession: "ENCSR411SUC", biosample: "stomach", lab: { name: "richard-myers" }, target: "EP300" }]
                },
                {
                    biosample: { name: "A549" },
                    counts: { biosamples: 1, labs: 2, projects: 2, species: 1, targets: 2, total: 2 },
                    datasets: [
                        { accession: "ENCSR933MHJ", biosample: "A549", lab: { name: "bradley-bernstein" }, target: "KDM5A" },
                        { accession: "ENCSR150EFU", biosample: "A549", lab: { name: "tim-reddy" }, target: "SMC3" }
                    ]
                },
                {
                    biosample: { name: "H1-hESC" },
                    counts: { biosamples: 1, labs: 1, projects: 1, species: 1, targets: 1, total: 1 },
                    datasets: [{ accession: "ENCSR160ZLP", biosample: "H1-hESC", lab: { name: "bradley-bernstein" }, target: "KDM5A" }]
                },
                {
                    biosample: { name: "GM12878" },
                    counts: { biosamples: 1, labs: 1, projects: 1, species: 1, targets: 1, total: 1 },
                    datasets: [{ accession: "ENCSR841NDX", biosample: "GM12878", lab: { name: "michael-snyder" }, target: "ELF1" }]
                },
                {
                    biosample: { name: "MCF-7" },
                    counts: { biosamples: 1, labs: 1, projects: 1, species: 1, targets: 1, total: 1 },
                    datasets: [{ accession: "ENCSR502NRF", biosample: "MCF-7", lab: { name: "michael-snyder" }, target: "ELF1" }]
                }
            ]);
        });

        test("can partition by lab", async () => {
            const partitionLab = `
query {
    peakDataset {
        partitionByLab {
            lab {
                name
            }
            counts {
                total
                targets
                biosamples
                species
                projects
                labs
            }
            datasets {
                accession
                biosample
                target
                lab {
                    name
                }
            }
        }
    }
}
            `;
            const response: Response = await request(app)
                .post("/graphql")
                .send({ query: partitionLab });
            expect(response.status).toBe(200);
            expect(response.body.data.peakDataset.partitionByLab).toEqual([
                {
                    counts: { biosamples: 2, labs: 1, projects: 1, species: 2, targets: 1, total: 2 },
                    datasets: [
                        { accession: "ENCSR428BSK", biosample: "G1E-ER4", lab: { name: "richard-myers" }, target: null },
                        { accession: "ENCSR411SUC", biosample: "stomach", lab: { name: "richard-myers" }, target: "EP300" }
                    ],
                    lab: { name: "richard-myers" }
                },
                {
                    counts: { biosamples: 2, labs: 1, projects: 1, species: 1, targets: 1, total: 2 },
                    datasets: [
                        { accession: "ENCSR933MHJ", biosample: "A549", lab: { name: "bradley-bernstein" }, target: "KDM5A" },
                        { accession: "ENCSR160ZLP", biosample: "H1-hESC", lab: { name: "bradley-bernstein" }, target: "KDM5A" }
                    ],
                    lab: { name: "bradley-bernstein" }
                },
                {
                    counts: { biosamples: 1, labs: 1, projects: 1, species: 1, targets: 1, total: 1 },
                    datasets: [{ accession: "ENCSR150EFU", biosample: "A549", lab: { name: "tim-reddy" }, target: "SMC3" }],
                    lab: { name: "tim-reddy" }
                },
                {
                    counts: { biosamples: 2, labs: 1, projects: 1, species: 1, targets: 1, total: 2 },
                    datasets: [
                        { accession: "ENCSR841NDX", biosample: "GM12878", lab: { name: "michael-snyder" }, target: "ELF1" },
                        { accession: "ENCSR502NRF", biosample: "MCF-7", lab: { name: "michael-snyder" }, target: "ELF1" }
                    ],
                    lab: { name: "michael-snyder" }
                }
            ]);
        });

        test("can partition by target", async () => {
            const partitionTarget = `
query {
    peakDataset {
        partitionByTarget {
            target {
                name
            }
            counts {
                total
                targets
                biosamples
                species
                projects
                labs
            }
            datasets {
                accession
                biosample
                target
                lab {
                    name
                }
            }
        }
    }
}
            `;
            const response: Response = await request(app)
                .post("/graphql")
                .send({ query: partitionTarget });
            expect(response.status).toBe(200);
            expect(response.body.data.peakDataset.partitionByTarget).toEqual([
                {
                    counts: { biosamples: 1, labs: 1, projects: 1, species: 1, targets: 0, total: 1 },
                    datasets: [{ accession: "ENCSR428BSK", biosample: "G1E-ER4", lab: { name: "richard-myers" }, target: null }],
                    target: null
                },
                {
                    counts: { biosamples: 1, labs: 1, projects: 1, species: 1, targets: 1, total: 1 },
                    datasets: [{ accession: "ENCSR411SUC", biosample: "stomach", lab: { name: "richard-myers" }, target: "EP300" }],
                    target: { name: "EP300" }
                },
                {
                    counts: { biosamples: 2, labs: 1, projects: 1, species: 1, targets: 1, total: 2 },
                    datasets: [
                        { accession: "ENCSR933MHJ", biosample: "A549", lab: { name: "bradley-bernstein" }, target: "KDM5A" },
                        { accession: "ENCSR160ZLP", biosample: "H1-hESC", lab: { name: "bradley-bernstein" }, target: "KDM5A" }
                    ],
                    target: { name: "KDM5A" }
                },
                {
                    counts: { biosamples: 1, labs: 1, projects: 1, species: 1, targets: 1, total: 1 },
                    datasets: [{ accession: "ENCSR150EFU", biosample: "A549", lab: { name: "tim-reddy" }, target: "SMC3" }],
                    target: { name: "SMC3" }
                },
                {
                    counts: { biosamples: 2, labs: 1, projects: 1, species: 1, targets: 1, total: 2 },
                    datasets: [
                        { accession: "ENCSR841NDX", biosample: "GM12878", lab: { name: "michael-snyder" }, target: "ELF1" },
                        { accession: "ENCSR502NRF", biosample: "MCF-7", lab: { name: "michael-snyder" }, target: "ELF1" }
                    ],
                    target: { name: "ELF1" }
                }
            ]);
        });

        test("can partition by in multiple layers", async () => {
            const partitionTarget = `
query {
    peakDataset {
        partitionByTarget {
            target {
                name
            }
            counts {
                total
                targets
                biosamples
                species
                projects
                labs
            }
            partitionByBiosample {
                biosample {
                    name
                }
                datasets {
                    accession
                    biosample
                    target
                    lab {
                        name
                    }
                }
            }
        }
    }
}
            `;
            const response: Response = await request(app)
                .post("/graphql")
                .send({ query: partitionTarget });
            expect(response.status).toBe(200);
            expect(response.body.data.peakDataset.partitionByTarget).toEqual([
                {
                    counts: { biosamples: 1, labs: 1, projects: 1, species: 1, targets: 0, total: 1 },
                    partitionByBiosample: [
                        {
                            biosample: { name: "G1E-ER4" },
                            datasets: [{ accession: "ENCSR428BSK", biosample: "G1E-ER4", lab: { name: "richard-myers" }, target: null }]
                        }
                    ],
                    target: null
                },
                {
                    counts: { biosamples: 1, labs: 1, projects: 1, species: 1, targets: 1, total: 1 },
                    partitionByBiosample: [
                        {
                            biosample: { name: "stomach" },
                            datasets: [{ accession: "ENCSR411SUC", biosample: "stomach", lab: { name: "richard-myers" }, target: "EP300" }]
                        }
                    ],
                    target: { name: "EP300" }
                },
                {
                    counts: { biosamples: 2, labs: 1, projects: 1, species: 1, targets: 1, total: 2 },
                    partitionByBiosample: [
                        {
                            biosample: { name: "A549" },
                            datasets: [{ accession: "ENCSR933MHJ", biosample: "A549", lab: { name: "bradley-bernstein" }, target: "KDM5A" }]
                        },
                        {
                            biosample: { name: "H1-hESC" },
                            datasets: [{ accession: "ENCSR160ZLP", biosample: "H1-hESC", lab: { name: "bradley-bernstein" }, target: "KDM5A" }]
                        }
                    ],
                    target: { name: "KDM5A" }
                },
                {
                    counts: { biosamples: 1, labs: 1, projects: 1, species: 1, targets: 1, total: 1 },
                    partitionByBiosample: [
                        { biosample: { name: "A549" }, datasets: [{ accession: "ENCSR150EFU", biosample: "A549", lab: { name: "tim-reddy" }, target: "SMC3" }] }
                    ],
                    target: { name: "SMC3" }
                },
                {
                    counts: { biosamples: 2, labs: 1, projects: 1, species: 1, targets: 1, total: 2 },
                    partitionByBiosample: [
                        {
                            biosample: { name: "GM12878" },
                            datasets: [{ accession: "ENCSR841NDX", biosample: "GM12878", lab: { name: "michael-snyder" }, target: "ELF1" }]
                        },
                        {
                            biosample: { name: "MCF-7" },
                            datasets: [{ accession: "ENCSR502NRF", biosample: "MCF-7", lab: { name: "michael-snyder" }, target: "ELF1" }]
                        }
                    ],
                    target: { name: "ELF1" }
                }
            ]);
        });
    });

    describe("can filter dataset collections", () => {
        test("can filter by biosample", async () => {
            const partitionBiosample = `
query($biosample: String!) {
    peakDataset {
        partitionByBiosample(name: $biosample) {
            biosample {
                name
            }
            counts {
                total
                targets
                biosamples
                species
                projects
                labs
            }
            datasets {
                accession
                biosample
                target
                lab {
                    name
                }
            }
        }
    }
}
            `;
            const variables = { biosample: "A549" };
            const response: Response = await request(app)
                .post("/graphql")
                .send({ query: partitionBiosample, variables });
            expect(response.status).toBe(200);
            expect(response.body.data.peakDataset.partitionByBiosample).toEqual([
                {
                    biosample: { name: "A549" },
                    counts: { biosamples: 1, labs: 2, projects: 2, species: 1, targets: 2, total: 2 },
                    datasets: [
                        { accession: "ENCSR933MHJ", biosample: "A549", lab: { name: "bradley-bernstein" }, target: "KDM5A" },
                        { accession: "ENCSR150EFU", biosample: "A549", lab: { name: "tim-reddy" }, target: "SMC3" }
                    ]
                }
            ]);
        });

        test("can filter by lab", async () => {
            const partitionLab = `
query($lab: String!) {
    peakDataset {
        partitionByLab(name: $lab) {
            lab {
                name
            }
            counts {
                total
                targets
                biosamples
                species
                projects
                labs
            }
            datasets {
                accession
                biosample
                target
                lab {
                    name
                }
            }
        }
    }
}
            `;
            const variables = { lab: "Tim Reddy" };
            const response: Response = await request(app)
                .post("/graphql")
                .send({ query: partitionLab, variables });
            expect(response.status).toBe(200);
            expect(response.body.data.peakDataset.partitionByLab).toEqual([
                {
                    counts: { biosamples: 1, labs: 1, projects: 1, species: 1, targets: 1, total: 1 },
                    datasets: [{ accession: "ENCSR150EFU", biosample: "A549", lab: { name: "tim-reddy" }, target: "SMC3" }],
                    lab: { name: "tim-reddy" }
                }
            ]);
        });

        test("can filter by target", async () => {
            const partitionTarget = `
query($target: String!) {
    peakDataset {
        partitionByTarget(name: $target) {
            target {
                name
            }
            counts {
                total
                targets
                biosamples
                species
                projects
                labs
            }
            datasets {
                accession
                biosample
                target
                lab {
                    name
                }
            }
        }
    }
}
            `;
            const variables = { target: "ELF1" };
            const response: Response = await request(app)
                .post("/graphql")
                .send({ query: partitionTarget, variables });
            expect(response.status).toBe(200);
            expect(response.body.data.peakDataset.partitionByTarget).toEqual([
                {
                    counts: { biosamples: 2, labs: 1, projects: 1, species: 1, targets: 1, total: 2 },
                    datasets: [
                        { accession: "ENCSR841NDX", biosample: "GM12878", lab: { name: "michael-snyder" }, target: "ELF1" },
                        { accession: "ENCSR502NRF", biosample: "MCF-7", lab: { name: "michael-snyder" }, target: "ELF1" }
                    ],
                    target: { name: "ELF1" }
                }
            ]);
        });
    });
});
