from flask import Flask, jsonify
from db.database import db_session, init_db
from db.models import User


init_db()
app = Flask(__name__)

@app.teardown_appcontext
def shutdown_session(exception=None):
    db_session.remove()

@app.route("/")
def show_all():
    # This is a test DB query example
    # user = User("fake@gmail", "FakeFirstName", "FakeLastName")
    # db_session.add(user)
    # db_session.commit()
    return jsonify(User.query.all())

if __name__ == '__main__':
    app.run(debug=True)
