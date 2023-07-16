import { Configuration, OpenAIApi } from 'openai'
import { process } from './env'

import { initializeApp } from 'firebase/app';
import { getDatabase, ref, push, get, remove } from "firebase/database";

// set openai configuration
const configuration = new Configuration({
    apiKey: process.env.OPENAI_API_KEY,
})

// init openai
const openai = new OpenAIApi(configuration)

// set Firebase configuration
const appSettings = {
    apiKey: process.env.FIREBASE_API_KEY,
    authDomain: process.env.FIREBASE_AUTH_DOMAIN,
    databaseURL: process.env.FIREBASE_DATABASE_URL,
    projectId: process.env.FIREBASE_PROJECT_ID,
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.FIREBASE_APP_ID
};

// Initialize Firebase app
const app = initializeApp(appSettings)


// Get a reference to the database service
const database = getDatabase(app)

// reference to converstaion in db
const conversationInDb = ref(database)

// select chatbotConverstation div in the form
const chatbotConversation = document.getElementById('chatbot-conversation')

// Chatbot instruction - system message
const instructionObj = {
    role: 'system',
    content: 'You are wise old owl that answers questions and gives advise. You try to rhyme when it makes sense.'
};



// submit event listener
document.addEventListener('submit', (e) => {
    e.preventDefault() // prevent page refresh
    const userInput = document.getElementById('user-input') // select user input.


    // add user input to conversation array
    // push using firebase push method
    push(conversationInDb, {
        role: 'user',
        content: userInput.value
    })
    // fetch reply
    fetchReply()
    // create new speech bubble for each message
    const newSpeechBubble = document.createElement('div') // create new speech bubble (div)
    newSpeechBubble.classList.add('speech', 'speech-human') // add speech and speech-human classes to new speech bubble
    chatbotConversation.appendChild(newSpeechBubble) // add new speech bubble to chatbotConversation
    newSpeechBubble.textContent = userInput.value // add text to the speech bubble
    userInput.value = '' // clear user input
    chatbotConversation.scrollTop = chatbotConversation.scrollHeight // scroll to bottom of chat
})

// fetchReply
function fetchReply() {
    // callback - snapshot of data as it exists in the database
    get(conversationInDb).then(async (snapshot) => {
        if (snapshot.exists()) {
            // console.log(snapshot)
            // console.log(snapshot.val())
            // console.log(Object.values(snapshot.val()))
            const conversationArray = Object.values(snapshot.val())
            // add instructionObj to conversationArray
            conversationArray.unshift(instructionObj)

            const response = await openai.createChatCompletion({
                model: 'gpt-4',
                messages: conversationArray,
                temperature: 1,
                presence_penalty: 0,
                frequency_penalty: 0.3,
            })
            console.log(response.data.choices[ 0 ].message)
            //  we want to add the whole response.data.choices[0] object so leave off the .content
            // Add the completion to the database
            push(conversationInDb, response.data.choices[ 0 ].message)


            // pass completion to typewriter function
            renderTypewriterText(response.data.choices[ 0 ].message.content)

        } else {
            console.log('No data available');
        }
    })


};


// typewriter effect
function renderTypewriterText(text) {
    const newSpeechBubble = document.createElement('div')
    newSpeechBubble.classList.add('speech', 'speech-ai', 'blinking-cursor')
    chatbotConversation.appendChild(newSpeechBubble)
    let i = 0
    const interval = setInterval(() => {
        newSpeechBubble.textContent += text.slice(i - 1, i)
        if (text.length === i) {
            clearInterval(interval)
            newSpeechBubble.classList.remove('blinking-cursor')
        }
        i++
        chatbotConversation.scrollTop = chatbotConversation.scrollHeight
    }, 50)
}

// clear conversation
document.getElementById('clear-btn').addEventListener('click', () => {
    remove(conversationInDb)
    chatbotConversation.innerHTML = '<div class="speech speech-ai">How can I help you?</div>'
})

// renderConversaionFromDB - render conversation from database
function renderConversaionFromDB() {
    // get conversation from database
    get(conversationInDb).then(async(snapshot) => {
        if(snapshot.exists()) {
            Object.values(snapshot.val()).forEach((message) => {
                const newSpeechBubble = document.createElement('div')
                newSpeechBubble.classList.add(
                    'speech', 
                    `speech-${dbOBj.role === 'user' ? 'human' : 'ai'} }`
                    )
                    chatbotConversation.appendChild(newSpeechBubble)
                    // add text to speech bubble
                    newSpeechBubble.textContent = dbObj.content
            })
            // scroll to bottom of chat
            chatbotConversation.scrollTop = chatbotConversation.scrollHeight
        }
    })
}
renderConversaionFromDB()