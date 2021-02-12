# user model modified from https://www.youtube.com/watch?v=CSHx6eCkmv0&list=PL-osiE80TeTs4UjLw5MM6OjgkjFeUxCYH&index=6
from itsdangerous import TimedJSONWebSignatureSerializer as Serializer
from dublinbikes import db, login_manager, app
from flask_login import UserMixin

#function for setup of login_manager extension
@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))

#Association table linking users to favourite stations (many-to-many relationship here)
#No class indicator needed as SQLAlchemy will handle modifications regarding this table
favourite_stations = db.Table('favourite_stations',
    db.Column('user_id', db.Integer, db.ForeignKey('user.id')),
    db.Column('station_id', db.Integer, db.ForeignKey('station.id'))
)

class User(db.Model, UserMixin): #UserMixin contains important information for loginmanager, such as is_authenticated
    id=db.Column(db.Integer, primary_key=True)
    email=db.Column(db.String(120),unique=True,nullable=False)
    password=db.Column(db.String(60),nullable=False)

    favs=db.relationship('Station', secondary=favourite_stations, backref=db.backref('favourited', lazy=True))

    def get_reset_token(self, expires_sec=1800):
        s = Serializer(app.config['SECRET_KEY'], expires_sec)
        return s.dumps({'user_id': self.id}).decode('utf-8')

    #telling python not to expect 'self' argument
    @staticmethod
    def verify_reset_token(token, expires_sec=1800):
        s = Serializer(app.config['SECRET_KEY'], expires_sec)
        try:
            user_id = s.loads(token)['user_id']
        except:
            return None
        return User.query.get(user_id)

    def __repr__(self):
        return f"User('{self.email}')"

#Table storing bike station names
class Station(db.Model):
    id=db.Column(db.Integer, primary_key=True)
    name=db.Column(db.String(100), unique=True, nullable=False)

    def __repr__(self):
        return f"Station('{self.name}')"