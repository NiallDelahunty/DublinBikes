from flask_wtf import FlaskForm
from flask_login import current_user
from wtforms import StringField, PasswordField, SubmitField, BooleanField
from wtforms.validators import DataRequired, Email, EqualTo, ValidationError
from dublinbikes.models import User

class RegistrationForm(FlaskForm):
    email=StringField('Email',validators=[DataRequired(),Email()]) #validators defined here only check validity at point of entry.
    password=PasswordField('Password',validators=[DataRequired()]) 
    confirm_password=PasswordField('Confirm Password',validators=[DataRequired(),EqualTo('password')]) # EqualTo compares data to field above
    submit=SubmitField('Sign Up')

    def validate_email(self,email): #mind naming convention, function is called from FlaskForm class inherited above.
        email=User.query.filter_by(email=email.data).first() #calls DB to check whether email is already taken.
        if email:
            raise ValidationError('An account has already been registered with this email address.')

class LoginForm(FlaskForm):
    email=StringField('Email',validators=[DataRequired(),Email()])
    password=PasswordField('Password',validators=[DataRequired()])
    remember=BooleanField('Remember Me')
    submit=SubmitField('Login')

class UpdateAccountForm(FlaskForm):
    email=StringField('Email',validators=[DataRequired(),Email()]) #validators defined here only check validity at point of entry.
    leapcard_name=StringField('Name')
    db_name=StringField('Name')
    leapcard_card_number=StringField('Card Number')
    db_card_number=StringField('Card Number')
    submit=SubmitField('Update')

    def validate_email(self,email): #mind naming convention, function is called from FlaskForm class inherited above.
        if email.data != current_user.email:
            email=User.query.filter_by(email=email.data).first() #calls DB to check whether email is already taken.
            if email:
                raise ValidationError('An account has already been registered with this email address.')

class RequestResetForm(FlaskForm):
    email=StringField('Email',validators=[DataRequired(),Email()])
    submit=SubmitField('Request Password Reset')

    def validate_email(self,email): #mind naming convention, function is called from FlaskForm class inherited above.
        email=User.query.filter_by(email=email.data).first() #calls DB to check whether email is already taken.
        if email is None:
            raise ValidationError('No account associated with that email. You must create an account first.')

class ResetPasswordForm(FlaskForm):
    password=PasswordField('Password',validators=[DataRequired()]) 
    confirm_password=PasswordField('Confirm Password',validators=[DataRequired(),EqualTo('password')]) # EqualTo compares data to field above
    submit=SubmitField('Reset Password')