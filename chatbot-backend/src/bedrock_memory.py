import json
import boto3
from boto3.dynamodb.conditions import Key
from langchain.retrievers.document_compressors import EmbeddingsFilter
from langchain_openai import OpenAIEmbeddings
from langchain_community.vectorstores import DeepLake
from langchain.retrievers import ContextualCompressionRetriever
#from botocore.exceptions import ClientError
from langchain_core.documents import Document
import os

  
# Bedrock client used to interact with APIs around models
bedrock = boto3.client(service_name='bedrock', region_name='us-east-1')
     
# Bedrock Runtime client used to invoke and question the models - used for client calls
bedrock_runtime = boto3.client(service_name='bedrock-runtime', region_name='us-east-1')

# DynamoDB client to interact with the DynamoDB table
dynamodb = boto3.resource('dynamodb', region_name='us-east-1')
dynamodb_table_name = os.environ['DYNAMODB_TABLE_NAME']
table = dynamodb.Table(dynamodb_table_name)

#table = dynamodb.Table('ConversationHistory')  # Make sure this matches your DynamoDB table name


def lambda_handler(event, context):
#    print("boto version" + boto3.__version__) 
#    print("event output") 
#    print(event)
    session_id = event['headers'].get('session-id', 'default_session')  # Assuming session-id is passed in headers
    user_input = event['body']

    # Retrieve previous conversation history from DynamoDB
    try:
        response = table.get_item(Key={'session_id': session_id})
        if 'Item' in response:
            conversation_history = response['Item']['conversation']
        else:
            conversation_history = ""
    except Exception as e:
        print(f"Error fetching conversation history: {e}")
        raise Exception("Error: failed to retrieve conversation history")

   # Add new user input to conversation history
    conversation_history += f"\n\nHuman: {user_input}\n\nAssistant:"

   
  
#    question = 'Here is my Q: {}!'.format(event['body']) 
#    prompt = event['body']
#    body = json.loads(event['body'])
#    prompt2 = body.get('prompt', '')
    
#    prompt = 'what is 2+2? Answer in 1 word.'
#model Inputs 

    inputs = json.dumps({
        "prompt": "\n\nHuman: "+ conversation_history + "\n\nAssistant:", 
        "temperature": 0.7, 
        "top_p": 0.901, 
        "top_k":250, 
        "max_tokens_to_sample": 3000, 
        "stop_sequences": ["\n\nHuman:"], 
        "anthropic_version": 'bedrock-2023-05-31'})
    modelId = 'anthropic.claude-v2'
    accept = 'application/json'
    contentType = 'application/json'

    try: 
        response = bedrock_runtime.invoke_model(body=inputs, modelId=modelId, accept=accept, contentType=contentType)
        response_body = json.loads(response.get('body').read())
        result = response_body['completion']

        # Update conversation history with the assistant's response
        conversation_history += f" {result}"
        # Store the updated conversation history back to DynamoDB
        table.put_item(
            Item={
                'session_id': session_id,
                'conversation': conversation_history
            }
        )

        # Process the result to generate an investment recommendation message
        recommendation_message = generate_recommendation_message(result)
        



        # Generate hypothetical chart data based on the recommendation message
        chart_data = generate_chart_data(result)



    except OSError as err:
        print("OS error:", err)
        raise Exception("Error: bedrock OS error")
    except ValueError:
        print("Not valid value.")
        raise Exception("Error: bedrock Not valid value")
    except Exception as err:
        print(f"Unexpected {err}, {type(err)}")
        raise Exception("Error: bedrock invoke failed")  
# 'what is 2+2? Answer in 1 word.'

    return {
        'statusCode': 200,
        'headers': {
            'Access-Control-Allow-Headers': '*',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'OPTIONS,POST,GET'
        },
        'body': json.dumps({ 
            "message": recommendation_message,
            "chartData": chart_data
        })
    }

# Helper function to generate recommendation message
def generate_recommendation_message(result):
    # Modify this as needed to produce user-friendly text.
    return f"Based on your financial situation, we recommend the following: {result}"

# Helper function to generate hypothetical investment chart data
def generate_chart_data(result):
    # Example of generating chart data based on the response
    # For demonstration purposes, let's generate 5 years of projections
    labels = ["Year 1", "Year 2", "Year 3", "Year 4", "Year 5"]
    values = [5000, 7000, 10000, 13000, 16000]  # Replace this logic with values derived from LLM analysis
    
    return {
        "labels": labels,
        "values": values
    }