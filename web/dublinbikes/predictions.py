import os
import pickle
import math
import pyowm
import datetime
from sklearn.ensemble import RandomForestRegressor

capacity = {'capacity': {'SMITHFIELD NORTH': 30, 'PARNELL SQUARE NORTH': 20, 'CLONMEL STREET': 33, 'AVONDALE ROAD': 40, 'MOUNT STREET LOWER': 40, 'CHRISTCHURCH PLACE': 20, 
'GRANTHAM STREET': 30, 'PEARSE STREET': 30, 'YORK STREET EAST': 32, 'EXCISE WALK': 40, 'FITZWILLIAM SQUARE WEST': 30, 'PORTOBELLO ROAD': 30, 'ST. JAMES HOSPITAL (CENTRAL)': 40, 
'PARNELL STREET': 20, 'FREDERICK STREET SOUTH': 40, 'CUSTOM HOUSE': 30, 'RATHDOWN ROAD': 40, "NORTH CIRCULAR ROAD (O'CONNELL'S)": 30, 'HANOVER QUAY': 40, 'OLIVER BOND STREET': 30, 'COLLINS BARRACKS MUSEUM': 38, 
'BROOKFIELD ROAD': 30, 'BENSON STREET': 40, 'EARLSFORT TERRACE': 30, 'GOLDEN LANE': 20, 'DEVERELL PLACE': 30, 'WILTON TERRACE (PARK)': 40, 'JOHN STREET WEST': 31, 'FENIAN STREET': 35, 'MERRION SQUARE SOUTH': 40, 
'SOUTH DOCK ROAD': 30, 'CITY QUAY': 30, 'EXCHEQUER STREET': 24, 'THE POINT': 40, 'BROADSTONE': 30, 'HATCH STREET': 36, 'LIME STREET': 40, 
'CHARLEMONT PLACE': 40, 'KILMAINHAM GAOL': 40, 'HARDWICKE PLACE': 25, 'WOLFE TONE STREET': 29, 'FRANCIS STREET': 30, 'GREEK STREET': 20, 'GUILD STREET': 40, 
'HERBERT PLACE': 30, 'HIGH STREET': 29, 'WESTERN WAY': 40, 'TALBOT STREET': 40, 'NEWMAN HOUSE': 40, "SIR PATRICK DUN'S": 40, 'NEW CENTRAL BANK': 40, 
'GRANGEGORMAN LOWER (CENTRAL)': 40, 'KING STREET NORTH': 30, 'KILLARNEY STREET': 30, 'HERBERT STREET': 40, 'HANOVER QUAY EAST': 40, 'CUSTOM HOUSE QUAY': 30, 
'MOLESWORTH STREET': 20, 'GEORGES QUAY': 20, 'KILMAINHAM LANE': 30, 'MOUNT BROWN': 22, 'MARKET STREET SOUTH': 38, 'KEVIN STREET': 40, 'ECCLES STREET EAST': 27, 
'GRAND CANAL DOCK': 40, 'MERRION SQUARE EAST': 30, 'YORK STREET WEST': 40, "ST. STEPHEN'S GREEN SOUTH": 30, 'DENMARK STREET GREAT': 20, 'ROYAL HOSPITAL': 40, 
'HEUSTON STATION (CAR PARK)': 40, 'GRANGEGORMAN LOWER (NORTH)': 36, "ST. STEPHEN'S GREEN EAST": 40, 'HEUSTON STATION (CENTRAL)': 40, 'TOWNSEND STREET': 20, 'GEORGES LANE': 40, 
'PHIBSBOROUGH ROAD': 40, 'ECCLES STREET': 20, 'PORTOBELLO HARBOUR': 30, 'MATER HOSPITAL': 40, 'BLESSINGTON STREET': 20, 'JAMES STREET': 40, 'MOUNTJOY SQUARE EAST': 40, 
'MERRION SQUARE WEST': 20, 'CONVENTION CENTRE': 40, 'HARDWICKE STREET': 16, 'PARKGATE STREET': 38, 'DAME STREET': 16, 'HEUSTON BRIDGE (SOUTH)': 25, 'CATHAL BRUGHA STREET': 20, 
'SANDWITH STREET': 40, 'BUCKINGHAM STREET LOWER': 29, 'ROTHE ABBEY': 35, 'CHARLEVILLE ROAD': 40, "PRINCES STREET slash O'CONNELL STREET": 23, 'UPPER SHERRARD STREET': 30, 
'FITZWILLIAM SQUARE EAST': 40, 'GRATTAN STREET': 23, 'ST JAMES HOSPITAL (LUAS)': 40, 'HARCOURT TERRACE': 20, 'BOLTON STREET': 20, 'JERVIS STREET': 21, 'ORMOND QUAY UPPER': 29, 
'GRANGEGORMAN LOWER (SOUTH)': 40, 'MOUNTJOY SQUARE WEST': 30, 'WILTON TERRACE': 20, 'EMMET ROAD': 40, 'HEUSTON BRIDGE (NORTH)': 40, 'LEINSTER STREET SOUTH': 30, 'BLACKHALL PLACE': 30}}

def prepro(name):
    return name.replace('/', 'slash')

def roundTime(dt=None, roundTo=60):
    """Round a datetime object to any time lapse in seconds
    dt : datetime.datetime object, default now.
    roundTo : Closest number of seconds to round to, default 1 minute.
    Author: Thierry Husson 2012.
    """
    if dt == None: 
        dt = datetime.datetime.now()
    seconds = (dt.replace(tzinfo=None) - dt.min).seconds
    rounding = (seconds+roundTo/2) // roundTo * roundTo
    return dt + datetime.timedelta(0,rounding-seconds,-dt.microsecond)

def tuple_builder(status, temp):
    weathers = ['Clear','Clouds','Drizzle','Fog','Mist','Rain']
    output = [0,0,0,0,0,0]
    for i, weather in enumerate(weathers):
        if status == weather:
            output[i] = 1
    output.insert(0, temp)
    return output

owm = pyowm.OWM(os.environ.get('OWM'))

def add_zero(time):
    if time.minute == 0:
        return "00"
    else:
        return time.minute

def predict_func(time, station):
    """
    Converts the given time to a datetime object, then looks for the weather forecast for that given time rounded to the nearest 3 hours.
    Builds the full tuple of weather + time tuples, then uses that to predict on the model loaded based on the given station. 
    Html string is returned
    """
    given_time = datetime.datetime.strptime(time, "%d %B %Y %I:%M %p")
    weather_tuple = [8, 0, 1, 0, 0, 0, 0]#default values
    icon = "02d"
    try:
        observation = owm.three_hours_forecast('Dublin,IE')
        w = observation.get_forecast()
        rounded_time = roundTime(given_time,roundTo=180*60)#round to 3 hour 

        #default values
        for weather in w:
            time = datetime.datetime.strptime(weather.get_reference_time('iso'), "%Y-%m-%d %H:%M:%S+00")
            if rounded_time == time:
                icon = weather.get_weather_icon_name()
                weather_tuple = tuple_builder(weather.get_status(),round(weather.get_temperature()['temp']-273.15, 2))
    except: pass

     

    pred_tuple = weather_tuple + [given_time.day, given_time.hour, given_time.minute, given_time.weekday()]
    station = prepro(station.upper())
    filename = 'dublinbikes/static/models/' + station + '.sav'
    model = pickle.load(open(filename, 'rb'))
    prediction = math.floor(model.predict([pred_tuple])[0])
    heading = '<div style="text-align: center;font-size:90%;border-top: solid rgb(8,76,85) 1px;border-bottom: solid rgb(8,76,85) 1px;color: rgb(8,76,85);">' + station  + " "+ str(given_time.day) + "/" + str(given_time.month)+ "/" + str(given_time.year) + " " +str(given_time.hour) + ':' + str(add_zero(given_time)) +'</span></div>'
    iconhtml = '<div id="standinfo"><div><img src="http://openweathermap.org/img/wn/' + icon + '@2x.png" alt="Weather Icon" style="height:80px;width:80px;display:flex;align-items:center;"></div>'
    text = '<div id="overall" style="display:flex;justify-content:center;flex-direction: column;"> <div>'  + '<span style="font-weight:bold;font-size:130%;"> Bikes: </span> <span style="color:red;font-weight:bold;font-size:130%;font-family: "Times New Roman", Times, serif;">' + str(prediction) + '</span> <img src = "/static/Imgs/bike_icon2.png" alt = "Bike" style="margin-bottom:8px;" >' +'</div>' 
    text2 = '<div> <span style="font-weight:bold;font-size:130%;"> Stands: </span> <span style="color:blue;font-weight:bold;font-size:130%;font-family: "Times New Roman", Times, serif;">'  +  str(abs(capacity['capacity'][station] - prediction)) + '</span> <img src = "static/Imgs/parking_icon.png" alt = "Bike" style="margin-bottom:8px;"></div></div></div>'
   
    return  heading + iconhtml + text + text2
