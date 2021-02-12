#package structure modified from https://www.youtube.com/watch?v=44PvX0Yv368&list=PL-osiE80TeTs4UjLw5MM6OjgkjFeUxCYH&index=5
import os
from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_bcrypt import Bcrypt
from flask_login import LoginManager
from flask_mail import Mail

app=Flask(__name__)
app.config['SECRET_KEY']=os.environ.get('FLASK_APP')
connect_string=connect_string = 'mysql+pymysql://{}:{}@{}:{}/{}?charset=utf8mb4'.format("admin", os.environ.get('USER_DB_PASS'), os.environ.get('USER_DB_HOSTNAME'),3306, 'dublinbikes')
app.config['SQLALCHEMY_DATABASE_URI']=connect_string
db=SQLAlchemy(app) #enables ORM for flask
bcrypt=Bcrypt(app) #enables bcrypt hashing for flask
login_manager=LoginManager(app) #provides user session mgmt for flask
login_manager.login_view='login' #assign function name of login route here
login_manager.login_message_category='info' #makes sure alert is consistent with flash design of bootstrap
app.config['MAIL_SERVER'] = 'smtp.googlemail.com'
app.config['MAIL_PORT'] = 587
app.config['MAIL_USE_TLS'] = True
app.config['MAIL_USERNAME'] = os.environ.get('MAIL_USERNAME')
app.config['MAIL_PASSWORD'] = os.environ.get('MAIL_PASSWORD')
mail = Mail(app)

from dublinbikes import routes