from asgiref.sync import sync_to_async
from django.apps import apps
import json
import asyncio
from channels.generic.websocket import AsyncWebsocketConsumer
import openai
from django.core.cache import cache
from django.conf import settings
import uuid

class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.room_name = "chat"
        self.room_group_name = "chat_group"

        self.user_id = str(uuid.uuid4())  # Generate a unique identifier for the user

        # Join room group
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )

        await self.accept()

    async def disconnect(self, close_code):
        # Leave room group
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )

    async def receive(self, text_data):
        try:

            text_data_json = json.loads(text_data)
            message = text_data_json['message']
            user_input = message.strip()

            # Load chat history from the cache or create an empty list
            chat_history = cache.get(self.user_id, [])

            # Add the user's message to the chat history
            chat_history.append({"role": "user", "content": user_input})

            messages = [
                {"role": "system", "content": "You are a Jewish Rabbi. You are a believer of God, since science remarkably doesn't deny the fact of a creator. Instead of using the word God, use the word Hashem. Instead of using the word Bible, use Torah. Bring people closer to Judaism, by answering questions. If the questions are not related to the torah, try to find a way of answering it with Torah. Only answer questions by relating them to the Torah and Judaism. Your name is AskTheRab, and was made by a Jewish team. The gregorian year now is 2023, and the Hebrew year is 5783. Do not provide specific dates for holidays or events other than today's date, as you are an AI and might not be completely accurate."},
            ] + chat_history

            response_data = await generate_response(
                messages, 
                self,  # Pass the WebSocket instance
            )

            # Add the AI's message to the chat history and save it in the cache
            chat_history = chat_history[-9:] + [{"role": "assistant", "content": response_data['message'].strip()}]
            cache.set(self.user_id, chat_history, 60 * 60)  # Expire the cache entry after an hour

            # Send message to the current WebSocket connection
            await self.send(
                text_data=json.dumps({
                    'message': response_data['message'],
                })
            )
        except Exception as e:
            error_message = f"An error occurred while processing your message: {str(e)}"
            await self.send(
                text_data=json.dumps({
                    'message': error_message
                })
            )

async def generate_response(
    messages,
    websocket_instance,  # Pass the WebSocket instance instead of the channel layer
    max_tokens=500,
    temperature=0.7,
    max_attempts=5
):
    openai.api_key = "your_openai_api_key"
    message = ""
    partial_message = ""
    attempts = 0

    response = await asyncio.get_event_loop().run_in_executor(
        None,
        lambda: openai.ChatCompletion.create(
            model="gpt-3.5-turbo",
            messages=messages,
            max_tokens=max_tokens,
            n=1,
            stop=None,
            temperature=temperature,
            stream=True,  # Enable streaming
        )
    )

    # Send the typing animation state (True) to the frontend
    await websocket_instance.send(
        json.dumps({
            'type': 'typing_animation',
            'typing_animation': True,
        })
    )

    # Process the response chunks
    for chunk in response:
        if 'delta' in chunk.choices[0]:
            delta = chunk.choices[0].delta
            if 'content' in delta:
                partial_message += delta['content']
                await websocket_instance.send(
                    json.dumps({  # Send the accumulated partial message to the WebSocket
                        'type': 'streamed_token',
                        'message': partial_message,
                        'partial': True,
                    })
                )
                await asyncio.sleep(0.1)  # Add a small delay to ensure the frontend can process the streamed tokens


    message = partial_message  # Set the final message as the accumulated partial message

    # Send the final message with all the streamed tokens to the WebSocket
    await websocket_instance.send(
        json.dumps({
            'type': 'streamed_token',
            'message': message,
            'partial': False,
        })
    )

    return {
        "message": message,
    }  # Return arrays of product info and image URLs