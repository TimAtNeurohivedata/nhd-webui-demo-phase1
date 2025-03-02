# nhd-webui-demo-phase1
NeuroHiveData WebUI for demo1

Instructions for Building and Uploading to AWS
==============================================
Can't build source code on AWS EC2 minor instance since it only has 1vCPU and is much too slow, so the solution is to build the image locally, upload to AWS, and start the Web Server on AWS

Build the source code for AWS
=============================

# git clone git@github.com:TimAtNeurohivedata/nhd-webui-demo-phase1.git
# cd nhd-webui-demo-phase1/workspace/
# ng build assets
# ng build ngcommon01-mat-theme-input
# ng build ngcommon02-stacked-line-chart
# ng build ngscreen01-eeg-a

Tar the build for AWS and upload it
===================================
Note: don't use node_module, it's way too large and much easier to install those on AWS

# tar -cvf upload.tar dist package.json angular.json
# scp upload.tar ubuntu@3.144.28.182:4200/tmp
