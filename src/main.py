from flask import Flask, jsonify, request
from db.database import db_session, init_db
from db.models import User, Tweet
import logging

logging.basicConfig(format='%(asctime)s %(levelname)-6s [%(filename)s:%(lineno)d] %(message)s',
                    datefmt='%Y-%m-%d:%H:%M:%S',
                    level=logging.INFO)


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
    return jsonify(Tweet.query.all())

@app.route("/push_tweet", methods=['POST', 'GET'])
def push_tweet():
    if request.method == 'POST':
        request_data = request.get_json()
        logging.debug("Checking Request")
        checks = ["tweet_id", "text", "time", "place"]
        for ck in checks:
            if ck not in request_data:
                msg = f"{ck} not found"
                logging.error(msg)
                return jsonify(msg), 400

        tweet = Tweet(
            tweet_id = request_data['tweet_id'],
            text = request_data['text'],
            time = request_data['time'],
            place = request_data['place']
        )
        db_session.add(tweet)
        db_session.commit()
        return jsonify(""), 200
    else:
        return jsonify("hello"), 200

if __name__ == '__main__':
    app.run(debug=True)

