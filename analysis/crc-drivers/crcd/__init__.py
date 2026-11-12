"""What explains the between-patient variation in the fetal-like programme?

Project 1 showed that a fetal-like epithelial programme is largely a patient-level
property in single-cell colorectal data. This project asks what patient-level variable
explains it, in bulk tumours where the sample size is an order of magnitude larger.

Bulk tissue reintroduces the confound that project 1 was able to control by restricting
to annotated epithelial cells: a signature containing stromal genes will track tumour
composition. Testing whether any association survives adjustment for composition is the
methodological core of this project, not an afterthought.
"""
__version__ = "0.1.0"
