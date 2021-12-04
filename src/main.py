from flask import Flask, jsonify, request, render_template
from db.database import db_session, init_db
from db.models import User, Tweet, Feedback
import logging

logging.basicConfig(format='%(asctime)s %(levelname)-6s [%(filename)s:%(lineno)d] %(message)s',
                    datefmt='%Y-%m-%d:%H:%M:%S',
                    level=logging.INFO)

feedback_converter = {'Strongly agree': 5, 'Somewhat agree': 4, 'Neutral': 3,
                     'Somewhat disagree': 2, 'Strongly disagree': 1}

init_db()
app = Flask(__name__, template_folder='templates')

@app.teardown_appcontext
def shutdown_session(exception=None):
    db_session.remove()


@app.route("/", methods=["GET", "POST"])
def test():
    if request.method == "POST":
        sentiment = request.form.get('sentiment')
        policy = request.form.get('policy')
        easy = request.form.get('easy')
        innovative = request.form.get('innovative')
        informative = request.form.get('informative')
        vizualise = request.form.get('vizualise')

        feedback = Feedback(
            feedback_converter[sentiment],
            feedback_converter[policy],
            feedback_converter[easy],
            int(innovative),
            int(informative),
            int(vizualise)
        )

        db_session.add(feedback)
        db_session.commit()

        return render_template("map.html")
    return render_template("map.html")

@app.route("/feedback")
def show_all_feedback():
    return jsonify(Feedback.query.all())

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
