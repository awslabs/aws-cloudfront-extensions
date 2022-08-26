# Authenticate to a public registry: aws ecr-public get-login-password --region us-east-1 | docker login --username AWS --password-stdin public.ecr.aws
FROM public.ecr.aws/lambda/python:3.8-x86_64

COPY *.py ${LAMBDA_TASK_ROOT}/
#COPY ../common_libs/*.py ${LAMBDA_TASK_ROOT}

# COPY requirements.txt  .
# RUN  pip3 install -r requirements.txt --target "${LAMBDA_TASK_ROOT}"

CMD ["sns_failure_notify.lambda_handler"]