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
    chatMessages,
    conversationItems,
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

    const responseMessage: MessageItem = await response.json()
    console.log('Response message:', responseMessage)
    /** Frontend expects updated chat message item in the following format:
    export interface MessageItem {
      type: 'message'
      role: 'user' | 'assistant' | 'system'
      content: string
    }
    */
    /** Python backend will send response following the above format
    response_data = {
        "type": "message",
        "role": "assistant",
        "content": chat_completion.choices[0].message.content,
    }
    */    
    
    // Update chat messages
    chatMessages.push(responseMessage)
    setChatMessages([...chatMessages])

    // Update conversation items
    conversationItems.push(responseMessage)
    setConversationItems([...conversationItems])
  } catch (error) {
    console.error('Error processing messages:', error)
  }
}
