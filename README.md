# Touria — AI Travel Planner

Touria is an AI-powered travel planner that creates personalized itineraries based on a user's destination and preferences. It combines AI with real-time APIs to make trip planning more interactive and useful.

## Features

- Generates personalized, day-by-day itineraries using OpenAI GPT-4o-mini
- Provides 7-day weather forecasts through WeatherAPI
- Retrieves destination images from Wikimedia
- Includes an AI chatbot for follow-up travel questions
- Uses RAG to provide relevant information to the AI before generating responses
- Tracks token usage and tests responses for potential hallucinations
- Uses Supabase for user authentication

## Tech Stack

**Frontend:** React, Vite, JavaScript, CSS  
**Backend:** Python, FastAPI  
**AI:** OpenAI GPT-4o-mini, RAG  
**APIs:** WeatherAPI, Wikimedia, Supabase

## Running Locally

Set up the backend environment variables for OpenAI, WeatherAPI, and Supabase, then run the FastAPI server. In a separate terminal, run the React/Vite frontend with:

```bash
npm install
npm run dev
