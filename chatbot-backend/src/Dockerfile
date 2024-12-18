ARG FUNCTION_DIR="/src"
FROM public.ecr.aws/lambda/python:3.9 AS build-image
ARG FUNCTION_DIR
RUN mkdir -p ${FUNCTION_DIR}
WORKDIR ${FUNCTION_DIR}
COPY . ${FUNCTION_DIR}
RUN pip install --target ${FUNCTION_DIR} -r requirements.txt
FROM public.ecr.aws/lambda/python:3.9
COPY --from=build-image ${FUNCTION_DIR} ${LAMBDA_TASK_ROOT}
CMD ["bedrock.lambda_handler"]