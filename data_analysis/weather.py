import os
import pyowm
import pandas as pd
import time


from sqlalchemy import create_engine
from sqlalchemy.types import Integer, String

def scrape_weather():
    owm = pyowm.OWM(os.environ.get('OWM'))

    def epoch_to_datetime(x):
        return time.strftime("%d %b %Y %H:%M:%S", time.localtime(x))

    observation = owm.weather_at_place('Dublin,IE')
    w = observation.get_weather()

    data = [{'current_weather':w.get_status(),'detailed_weather':w.get_detailed_status(), 
    'temperature': w.get_temperature('celsius')['temp'], 'last_update':epoch_to_datetime(w.get_reference_time())}]
    df = pd.DataFrame(data)
    
    return df


def to_database(df):
    #establishing the connection to the remote rds database
    connect_string = 'mysql+pymysql://{}:{}@{}:{}/{}?charset=utf8mb4'.format("admin", os.environ.get('PRED_DB_PASS'), os.environ.get('PRED_DB_HOSTNAME'), 3306, "dublinbikes")
    engine = create_engine(connect_string, echo=False)


    #sending the dynamic columns of the dataframe to the sql server
    df.to_sql("Weather",
                engine,
                if_exists ='append',
                index=False,
                chunksize=200,
                dtype={
                    'current_weather':String(45),
                    'detailed_weather': String(45),
                    'temperature': Integer,
                    'last_update':String(20)
                })
    engine.execute("SELECT * FROM Weather").fetchall()

def main():
    df = scrape_weather()
    to_database(df)
    print(df)

if __name__=="__main__":
    main()