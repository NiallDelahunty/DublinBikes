import secrets
from flask import Flask,render_template, url_for, flash, redirect, jsonify, request, request
from dublinbikes import app, db, bcrypt, predictions, mail
from dublinbikes.forms import RegistrationForm, LoginForm, UpdateAccountForm, RequestResetForm, ResetPasswordForm
from dublinbikes.models import User, Station
import requests, json
from flask_login import login_user, current_user, logout_user, login_required
import os.path as path
import os
from flask_mail import Message


@app.route("/")
def default(): 
    owm_key=os.environ.get('OWM')
    request="https://maps.googleapis.com/maps/api/js?key="+os.environ.get('GOOGLE_KEY')+"&callback=initMap"
    return render_template("home.html", request=request,key=owm_key)

@app.route("/about")
def about():   
    return render_template("about.html")

@app.route('/json/')
def jason():
    data = fetch_data_from_api()
    return data

@app.route('/hist_json/')
def hist_json():
    with open('hist_data.txt') as json_file:
        hist_data = json.load(json_file)
    return hist_data

def return_pepper():
    # Retrieves pepper from config file
    three_up =  path.abspath(path.join(__file__ ,"../../.."))
    file = open(three_up + "/config.txt", 'r')
    # Keep password on first line of file
    available = file.readlines()[0]
    # Get rid of whitespace
    pep = available.strip()
    return pep

@app.route('/get_pred')
def get_prediction():
    station = request.args.get('station')
    date = request.args.get('date')
    time = request.args.get('time')

    prediction = predictions.predict_func(date + ' ' + time, station)
    return jsonify({'html':prediction})

def fetch_data_from_api():
    apiKey =  os.environ.get('JCD')
    contract_name = 'dublin'

    url = 'https://api.jcdecaux.com/vls/v1/stations?contract=' + contract_name + '&apiKey=' + apiKey
    r = requests.get(url, headers={'User-Agent': "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/70.0.3538.77 Safari/537.36"})
    data = r.json()
    data2 = {}
    for i, stop in enumerate(data):
        data2[i] = stop
    return data2

#register, login and logout routes modified from https://www.youtube.com/watch?v=CSHx6eCkmv0&list=PL-osiE80TeTs4UjLw5MM6OjgkjFeUxCYH&index=6
@app.route("/register", methods=['GET', 'POST'])
def register():
    if current_user.is_authenticated: #only allow access to registration page if no active user session is ongoing.
        return redirect(url_for('default'))
    form=RegistrationForm()
    if form.validate_on_submit():
        pep = return_pepper()
        pword= form.password.data + pep
        hashed_password=bcrypt.generate_password_hash(pword).decode('utf-8') # decode() decodes from byte to String.
        user=User(email=form.email.data, password=hashed_password)
        db.session.add(user)
        db.session.commit()
        flash('Your account has been created!','success')
        return redirect(url_for('login'))
    return render_template('register.html',title='Register',form=form)

@app.route("/login", methods=['GET','POST'])
def login():
    if current_user.is_authenticated: #only allow access to login page if no active user session is ongoing.
        return redirect(url_for('default'))
    form=LoginForm()
    if form.validate_on_submit():
        user=User.query.filter_by(email=form.email.data).first()
        pep = return_pepper()
        pword= form.password.data + pep
        if user and bcrypt.check_password_hash(user.password,pword): #check if user exists and password matches.
            login_user(user,remember=form.remember.data) #logs current_user in to session
            next_page = request.args.get('next') #if user was redirected to login, previous page is assigned here.
            return redirect(next_page) if next_page else redirect(url_for('default')) #redirect to previous page if user was redirected to login.
        else:
            flash('Login Unsuccessful. Please check email and password', 'danger')
    return render_template('login.html',title='Login',form=form)

@app.route("/logout")
def logout():
    logout_user() #logs current_user out of session
    return redirect(url_for('login'))

@app.route("/account", methods=['GET', 'POST'])
@login_required
def account():
    form = UpdateAccountForm()
    if form.validate_on_submit():
        current_user.email = form.email.data
        db.session.commit()
        return redirect(url_for('account')) #needed to overcome the post/get redirect pattern
    elif request.method == 'GET':
        form.email.data = current_user.email
    return render_template('account.html',title='Account', form=form)

def send_reset_email(user):
    token = user.get_reset_token()
    msg = Message('Password Reset Request', sender='dbproject.noreply@gmail.com', recipients=[user.email])
    #indentation broken here to prevent indentation in the email to the user
    msg.body = f'''To reset your password, visit the following link:
{url_for('reset_token', token=token, _external=True)} 
    
If you did not make this request, ignore this email and no changes will be made
'''
    mail.send(msg)

@app.route("/reset_password", methods=['GET', 'POST'])
def reset_request():
    if current_user.is_authenticated: #only allow access to login page if no active user session is ongoing.
        return redirect(url_for('default'))
    form = RequestResetForm()
    if form.validate_on_submit():
        user = User.query.filter_by(email=form.email.data).first()
        send_reset_email(user)
        flash('An email has been sent with instructions to reset your password', 'info')
        return redirect(url_for('login'))
    return render_template('reset_request.html', title='Reset Password', form=form)

@app.route("/reset_password/<token>", methods=['GET', 'POST'])
def reset_token(token):
    if current_user.is_authenticated: #only allow access to login page if no active user session is ongoing.
        return redirect(url_for('default'))
    user = User.verify_reset_token(token)
    if user is None:
        flash('Invalid or expired token', 'warning')
        return redirect(url_for('reset_request'))
    form = ResetPasswordForm()
    if form.validate_on_submit():
        pep = return_pepper()
        pword = form.password.data + pep
        hashed_password=bcrypt.generate_password_hash(pword).decode('utf-8') # decode() decodes from byte to String.
        user.password = hashed_password
        db.session.commit()
        flash('Your password has been updated! You are now able to log in','success')
        return redirect(url_for('login'))
    return render_template('reset_token.html', title='Reset Password', form=form) 