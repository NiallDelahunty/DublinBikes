import pandas as pd
from sqlalchemy import create_engine
# from sqlalchemy.types import Integer, Text, String, DateTime
import time


def read_database(db):
    connect_string = 'mysql+pymysql://{}:{}@{}:{}/{}?charset=utf8mb4'.format("admin", "SoftwarePass!", 'database-1.chkvd5qjrkby.us-east-1.rds.amazonaws.com', 3306, "dublinbikes")
    engine = create_engine(connect_string, echo=False)
    df = pd.read_sql(db, engine)
    return df

df1 = read_database("Bikes")#or "Weather", "Bikes"
# print(df1)
# df2 = read_database("Weather")
# print(df2)


df1['last_update'] = pd.to_datetime(df1['last_update'])
smithF = df1.loc[df1['name'] == 'SMITHFIELD NORTH']#isolate one station
smithF = smithF.groupby('last_update')['available_bikes'].mean().reset_index()#combine all the data collected at the same time and average, not necessary as th value shouldnt change
smithF = smithF.set_index('last_update')

print(smithF)
# print(smithF.index)
# print(smithF)


# import matplotlib.pyplot as plt
y = smithF['available_bikes'].resample('H').mean()#taking the mean value for an hour for plotting purposeses
print(y)
y.to_csv("Smith.csv", index=True)
# y = y.groupby(y.strftime('%H:%M:%S')).mean()#.reindex(y.time.dt.strftime('%H:%M:%S'))
# print(y)
# y.plot(figsize=(15, 6))
# plt.show()

# df = pd.read_sql("Bikes", engine)
# df['last_update'] = pd.to_datetime(df['last_update'])
# total_num_bikes = 3510# print(df['bike_stands'].sum())

# df = df.set_index('last_update')
# from datetime import datetime
# total_available_bikes = df.groupby(df.index.map(lambda t: datetime(t.year, t.month, t.day, t.hour, t.minute)))['available_bikes'].sum()
# df['bikes_in_use'] = df[total_num_bikes-total_available_bikes]
# print(total_available_bikes)

# df = df.set_index('last_update')
# from datetime import datetime

# total_available_bikes = df.groupby(df.index.map(lambda t: datetime(t.year, t.month, t.day, t.hour, t.minute)))['available_bikes'].sum()
# print(total_available_bikes)
# df2 = total_num_bikes - total_available_bikes
# print(total_available_bikes.describe())
# print(df2.describe())

# import matplotlib.pyplot as plt
# df2.plot(figsize=(15, 6))
# plt.show()