# Authenticate to a public registry: aws ecr-public get-login-password --region us-east-1 | docker login --username AWS --password-stdin public.ecr.aws
FROM public.ecr.aws/lambda/python:3.8

# install openssl
# RUN yum update -y && yum install -y make gcc perl-core pcre-devel wget zlib-devel
# RUN wget https://ftp.openssl.org/source/openssl-1.1.1k.tar.gz
# RUN tar -xzvf openssl-1.1.1k.tar.gz
# RUN cd openssl-1.1.1k && make && make install
RUN yum update -y && yum install -y openssl

COPY *.py ${LAMBDA_TASK_ROOT}/
#COPY ../common_libs/*.py ${LAMBDA_TASK_ROOT}

# COPY requirements.txt  .
# RUN  pip3 install -r requirements.txt --target "${LAMBDA_TASK_ROOT}"
#

CMD ["failure_handling.lambda_handler"]