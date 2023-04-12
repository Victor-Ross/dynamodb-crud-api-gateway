import {
  GetItemCommand,
  PutItemCommand,
  DeleteItemCommand,
  ScanCommand,
  UpdateItemCommand,
  UpdateItemCommandInput,
  DeleteItemCommandInput,
} from '@aws-sdk/client-dynamodb';
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';
import { client } from './db';
import {
  APIGatewayProxyEvent,
  APIGatewayProxyHandler,
  APIGatewayProxyResult,
} from 'aws-lambda';

const response: APIGatewayProxyResult = {
  statusCode: 200,
  body: JSON.stringify({
    message: 'Success',
  }),
};

export const getPost: APIGatewayProxyHandler = async (
  event: APIGatewayProxyEvent
) => {
  try {
    const params = {
      TableName: process.env.DYNAMODB_TABLE_NAME,
      Key: marshall({
        postId: event.pathParameters?.postId,
      }),
    };
    const { Item } = await client.send(new GetItemCommand(params));
    response.body = JSON.stringify({
      message: 'Successfully retrieved post',
      data: Item ? unmarshall(Item) : {},
      rawData: Item,
    });
    console.log({ Item });
  } catch (error: any) {
    response.statusCode = 500;
    response.body = JSON.stringify({
      message: 'Failed to get post',
      errorMsg: error.message,
      errorStack: error.stack,
    });
  }

  return response;
};

export const createPost: APIGatewayProxyHandler = async (
  event: APIGatewayProxyEvent
) => {
  try {
    if (event.body === null) {
      throw new Error('Request body cannot be null');
    }

    const body = JSON.parse(event.body);
    const params = {
      TableName: process.env.DYNAMODB_TABLE_NAME,
      Item: marshall(body || {}),
    };
    const createResult = await client.send(new PutItemCommand(params));

    response.body = JSON.stringify({
      message: 'Successfully created post',
      createResult,
    });
  } catch (error: any) {
    console.log(error);
    response.statusCode = 500;
    response.body = JSON.stringify({
      message: 'Failed to create post',
      errorMsg: error.message,
      errorStack: error.stack,
    });
  }

  return response;
};

export const updatePost: APIGatewayProxyHandler = async (
  event: APIGatewayProxyEvent
) => {
  try {
    if (event.body === null) {
      throw new Error('Request body cannot be null');
    }
    if (event.pathParameters === null) {
      throw new Error('Path parameters cannot be null');
    }

    const body = JSON.parse(event.body);
    const objKeys = Object.keys(body);

    const params: UpdateItemCommandInput = {
      TableName: process.env.DYNAMODB_TABLE_NAME,
      Key: marshall({ postId: event.pathParameters.postId }),
      UpdateExpression: `SET ${objKeys.map(
        (__, index) => `#key${index} = :value${index}`
      )}`,
      ExpressionAttributeNames: objKeys.reduce(
        (acc, key, index) => ({
          ...acc,
          [`#key${index}`]: key,
        }),
        {}
      ),
      ExpressionAttributeValues: marshall(
        objKeys.reduce(
          (acc, key, index) => ({
            ...acc,
            [`:value${index}`]: body[key],
          }),
          {}
        )
      ),
    };
    const updateResult = await client.send(new UpdateItemCommand(params));

    response.body = JSON.stringify({
      message: 'Successfully updated post',
      updateResult,
    });
  } catch (error: any) {
    console.log(error);
    response.statusCode = 500;
    response.body = JSON.stringify({
      message: 'Failed to update post',
      errorMsg: error.message,
      errorStack: error.stack,
    });
  }

  return response;
};

export const deletePost: APIGatewayProxyHandler = async (
  event: APIGatewayProxyEvent
) => {
  try {
    if (event.pathParameters === null) {
      throw new Error('Path parameters cannot be null');
    }
    const params: DeleteItemCommandInput = {
      TableName: process.env.DYNAMODB_TABLE_NAME,
      Key: marshall({ postId: event.pathParameters.postId }),
    };

    const deleteResult = await client.send(new DeleteItemCommand(params));

    response.body = JSON.stringify({
      message: 'Successfully deleted post',
      deleteResult,
    });
  } catch (error: any) {
    console.log(error);
    response.statusCode = 500;
    response.body = JSON.stringify({
      message: 'Failed to delete post',
      errorMsg: error.message,
      errorStack: error.stack,
    });
  }

  return response;
};

export const getAllPosts: APIGatewayProxyHandler = async (
  event: APIGatewayProxyEvent
) => {
  try {
    const { Items } = await client.send(
      new ScanCommand({ TableName: process.env.DYNAMODB_TABLE_NAME })
    );

    response.body = JSON.stringify({
      message: 'Successfully retrieved posts',
      data: Items ? Items.map((item) => unmarshall(item)) : {},
      Items,
    });
  } catch (error: any) {
    console.log(error);
    response.statusCode = 500;
    response.body = JSON.stringify({
      message: 'Failed to retrieve posts',
      errorMsg: error.message,
      errorStack: error.stack,
    });
  }

  return response;
};
