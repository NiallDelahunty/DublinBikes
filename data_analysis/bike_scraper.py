import os
from sqlalchemy import create_engine
from sqlalchemy.types import Integer, String
import requests, pandas as pd, json, time

def scrape_bikes():
    #Scraping the bike data from the api and putting it into an api
    apiKey =  os.environ.get('JCD')
    contract_name = 'dublin'

    url = 'https://api.jcdecaux.com/vls/v1/stations?contract=' + contract_name + '&apiKey=' + apiKey
    r = requests.get(url, headers={'User-Agent': "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/70.0.3538.77 Safari/537.36"})
    data = json.loads(r.text)
    #converting the response to json then to a dataframe
    df = pd.io.json.json_normalize(data)
    return df

def to_database(df):
    #establishing the connection to the remote rds database
    connect_string = 'mysql+pymysql://{}:{}@{}:{}/{}?charset=utf8mb4'.format("admin", os.environ.get('PRED_DB_PASS'), os.environ.get('PRED_DB_HOSTNAME'), 3306, "dublinbikes")
    engine = create_engine(connect_string, echo=False)


    #converting the last_update column values from epoch to datetime object
    df['last_update'] = df['last_update'].map(lambda x: str(time.strftime("%d %b %Y %H:%M:%S", time.localtime(int(x/1000)))))
    # print(df.columns)
    #sending the dynamic columns of the dataframe to the sql server
    df[['name','available_bike_stands','available_bikes', 'status', 'last_update']].to_sql("Bikes",
                engine,
                if_exists ='append',
                index=False,
                chunksize=200,
                dtype={
                    'name':String(45),
                    'available_bike_stands': Integer,
                    'available_bikes': Integer,
                    'status':String(10),
                    'last_update':String(20)
                })
    engine.execute("SELECT * FROM Bikes").fetchall()

def main():
    df = scrape_bikes()
    to_database(df)


if __name__=="__main__":
    main()

