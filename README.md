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

# (cd ../.. ; tar -cvf /tmp/upload.tar nhd-webui-demo-phase1/basic-html-screen/ nhd-webui-demo-phase1/server/ nhd-webui-demo-phase1/workspace/dist/ nhd-webui-demo-phase1/workspace/package.json nhd-webui-demo-phase1/workspace/angular.json)
# scp -i ~/.ssh/neurohivedata-demo1.pem /tmp/upload.tar ubuntu@ec2-3-149-25-9.us-east-2.compute.amazonaws.com:/tmp/upload.tar

Connect to the AWS EC2 instance, unzip the tar file, and restart the web server
===============================================================================

ubuntu@ubuntu-Virtual-Machine:~$ ssh -i ~/.ssh/neurohivedata-demo1.pem ubuntu@ec2-3-149-25-9.us-east-2.compute.amazonaws.com
Now logged into AWS EC2 instance
ubuntu@ip-172-31-5-45:~$ cd neurohivedata/
ubuntu@ip-172-31-5-45:~/neurohivedata$ mv nhd-webui-demo-phase1 save//nhd-webui-demo-phase1-before-3-7-2025
ubuntu@ip-172-31-5-45:~/neurohivedata$ tar -xvf /tmp/upload.tar
ubuntu@ip-172-31-5-45:~/neurohivedata$ cd nhd-webui-demo-phase1/workspace/
ubuntu@ip-172-31-5-45:~/neurohivedata/nhd-webui-demo-phase1/workspace$ npm install
ubuntu@ip-172-31-5-45:~/neurohivedata/nhd-webui-demo-phase1/workspace$ ../server/lighttpd-stop.bash ; ../server/lighttpd-start.bash


