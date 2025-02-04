import { ChatCompletionMessageParam } from 'openai/resources/chat/completions'
import { SYSTEM_PROMPT } from './constants'
import useConversationStore from '@/stores/useConversationStore'

export interface MessageItem {
  type: 'message'
  role: 'user' | 'assistant' | 'system'
  content: string

}

export interface FunctionCallItem {
  type: 'function_call'
  status: 'in_progress' | 'completed' | 'failed'
  id: string
  name: string
  arguments: string
  parsedArguments: any
  output: string | null
}

export type Item = MessageItem | FunctionCallItem

export const handleTurn = async () => {
  const {
    chatMessages, // history of all chat messages. Displayed in the chat UI
    conversationItems, // history of all system/developer/user/toolcall messages. Sent to the chat completions API
    setChatMessages,
    setConversationItems
  } = useConversationStore.getState()

  const allConversationItems: ChatCompletionMessageParam[] = [
    {
      role: 'system',
      content: SYSTEM_PROMPT
    },
    ...conversationItems
  ]

  try {
    // To use the python backend, replace by
    const response = await fetch('http://localhost:8000/get_response', {
    // const response = await fetch('/api/get_response', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ messages: allConversationItems })
    })

    // console.log('Response before await:', response)

    if (!response.ok) {
      console.error(`Error: ${response.statusText}`)
      return
    }

    const responseJSON = await response.json()
    console.log('Response JSON:', responseJSON)
    /** Python backend will send response in the following formats
    ***** Text message:
    {
        "audio": null,
        "content": "Hello! How can I assist you today?",
        "function_call": null,
        "refusal": null,
        "role": "assistant",
        "tool_calls": null
    }
    ***** Tool call:
    {
        "audio": null,
        "content": null,
        "function_call": null,
        "refusal": null,
        "role": "assistant",
        "tool_calls": [
            {
                "function": {
                    "arguments": "{\"location\": \"Paris, Ile-de-France, France\"}",
                    "name": "search_location"
                },
                "id": "call_toEOimMhZ0IcMtRimuhMAxF9",
                "type": "function"
            },
            {
                "function": {
                    "arguments": "{\"location\": \"Paris, Ile-de-France, France\"}",
                    "name": "search_location"
                },
                "id": "call_9gsmRatVhB7kowabd5oUvIpL",
                "type": "function"
            }
        ]
    }
    */
    
    const conversationItem = responseJSON

    // Update conversation items store
    conversationItems.push(conversationItem)
    setConversationItems([...conversationItems])

    if (conversationItem.tool_calls && conversationItem.tool_calls.length > 0) {
      // make tool call
      

    } else {
      // Update chat messages
      const responseMessage = conversationItem
      chatMessages.push(responseMessage)
      setChatMessages([...chatMessages])
    }
  } catch (error) {
    console.error('Error processing messages:', error)
  }
}
