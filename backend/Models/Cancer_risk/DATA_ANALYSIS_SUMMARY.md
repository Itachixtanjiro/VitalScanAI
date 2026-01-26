# Cancer Risk Model - Data Analysis Summary

## Dataset Overview

### Available Datasets in `D:\VitalScanAI\backend\Models\Cancer_risk\dataset\Data_ssGBLUP`:

1. **pedigree.txt** (270 KB)
   - Contains: Animal ID, Sire, Dam
   - 12,010 animals total

2. **phenotypes.txt** (302 KB)
   - Contains: Animal ID, Sex, Phenotype, True Breeding Value, Generation
   - 10,000 phenotyped animals

3. **genotypes.txt** (91 MB)
   - Contains: Animal ID, SNP genotypes (0,1,2 encoding)
   - 2,024 genotyped animals
   - ~45,000 SNP markers per animal

4. **gen_map.txt** (954 KB)
   - Contains: SNP Order, Chromosome, Position (bp)
   - 29 chromosomes
   - ~45,000 SNP positions

5. **Data description** (2.5 KB)
   - Simulation details and methodology

### Genotype Images Directory (`genotypes/`)
Contains 2,024 PNG visualization files organized in subdirectories:
- `all/` - 2,024 images
- `all_chr/` - Chromosome-specific views
- `bv/` - Breeding value visualizations  
- `bv_chr/` - BV by chromosome
- `phen/` - Phenotype visualizations
- `phen_chr/` - Phenotype by chromosome

## Analysis Code Blocks Added to Model.ipynb

### 1. **Data Loading** (Section 2)
- Loads all 4 main datasets
- Validates file paths
- Reports dataset dimensions

### 2. **Pedigree Analysis** (Section 3.1)
- Total animals, founders, sires, dams
- Family structure statistics
- Missing parent analysis

### 3. **Phenotype Analysis** (Section 3.2)
- Distribution plots (histograms)
- Sex and generation breakdowns
- Correlation with breeding values
- Missing value checks

### 4. **Genetic Map Analysis** (Section 3.3)
- SNPs per chromosome
- Chromosome length distribution
- SNP density visualization
- Position mapping across genome

### 5. **Genotype Analysis** (Section 3.4)
- Allele frequency distributions
- Minor Allele Frequency (MAF) calculation
- Genotype encoding validation
- Sample-based statistics

### 6. **Data Integration** (Section 3.5)
- Overlap between datasets
- Coverage statistics
- Merged dataset creation

### 7. **Feature Engineering** (Section 4)
- Risk class creation (Low/Medium/High)
- PCA dimensionality reduction
- Scree plots and variance explained

### 8. **Model Training & Evaluation** (Sections 5-7)
- Train/test split with stratification
- Decision Tree training
- Confusion matrix
- Cross-validation (5-fold)
- Classification metrics

### 9. **Model Interpretability** (Section 8)
- Feature importance ranking
- Top 20 SNP markers
- Decision tree rules extraction
- Tree visualization

## Key Findings from Data Description

- **Simulation**: QMSim software
- **Heritability**: 0.4 (40% genetic, 60% environmental)
- **QTL**: 500 quantitative trait loci
- **Linkage Disequilibrium**: Average 0.18
- **Generations**: 5 recent generations analyzed
- **Quality Control**: ~45,000 SNPs passed QC from 54,000 simulated

## Next Steps

1. Run the notebook cells sequentially
2. Review visualizations for data quality
3. Adjust model hyperparameters based on results
4. Consider additional feature selection methods
5. Explore ensemble methods for improved accuracy
