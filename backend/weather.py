# WeatherAPI forecast helper with in-process cache
import os
import requests

_weather_cache = {}

def get_weather(destination):
    """
    Gets weather forecast from WeatherAPI.com
    """

    if not destination:
        return None

    # Check if we already requested this location
    if destination.lower() in _weather_cache:
        return _weather_cache[destination.lower()]

    try:
        url = "https://api.weatherapi.com/v1/forecast.json"

        params = {
            "key": os.environ.get("WEATHER_API_KEY"),
            "q": destination,
            "days": 7,
            "aqi": "no",
            "alerts": "yes"
        }

        response = requests.get(
            url,
            params=params,
            timeout=5
        )

        if response.status_code != 200:
            print("Weather API failed:", response.text)
            return {}

        data = response.json()

        weather = {
            "location": data["location"]["name"],
            "country": data["location"]["country"],
            "temperature": data["current"]["temp_f"],
            "condition": data["current"]["condition"]["text"],
            "forecast": []
        }


        for day in data["forecast"]["forecastday"]:
            weather["forecast"].append({
                "date": day["date"],
                "high": day["day"]["maxtemp_f"],
                "low": day["day"]["mintemp_f"],
                "rain_chance": day["day"]["daily_chance_of_rain"],
                "condition": day["day"]["condition"]["text"]
            })


        _weather_cache[destination.lower()] = weather

        return weather


    except Exception as e:
        print("Weather error:", e)
        return None
