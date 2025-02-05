import { ChatCompletionMessageParam } from 'openai/resources/chat/completions'
import { SYSTEM_PROMPT } from './constants'
import useConversationStore from '@/stores/useConversationStore'

const API_URL = 'http://localhost:8000'

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
    const response = await fetch(API_URL + '/get_response', {
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
      console.log('Tool call:', conversationItem.tool_calls)
      const tool_call = conversationItem.tool_calls[0]
      const tool_response = await handleToolcall(tool_call.function.name, tool_call.function.arguments)
      console.log('Tool response:', tool_response)
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

export const handleToolcall = async (tool: keyof typeof TOOL_API_MAP, params: string) => {
  console.log("handleToolcall", tool, params)
  const TOOL_API_MAP = {
    search_location: "/search_location"
  }

  try {
    const response = await fetch(API_URL + TOOL_API_MAP[tool], {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: params
    })

    if (!response.ok) {
      console.error(`Error: ${response.statusText}`)
      return
    }

    const responseJSON = await response.json()
    console.log('Tool call [' + tool + '] Response JSON:', responseJSON)

  } catch (error) {
    console.error('Error processing toolcall:', error)
  }
}