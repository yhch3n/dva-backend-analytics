import boto3
import json
from tqdm import tqdm
from datetime import datetime
import requests


s3 = boto3.resource('s3')
BUCKET = "cse6242-team005"
TWEET_DIR = "tweets"
my_bucket = s3.Bucket(BUCKET)
DB_url = "http://localhost:5000/push_tweet"

fail_cnt = 0
for tweet_obj in tqdm(my_bucket.objects.filter(Prefix=TWEET_DIR)):
    tweet = json.loads(tweet_obj.get()['Body'].read().decode('utf-8'))
    try:
        tweet_id = tweet['id_str']
        place = tweet['place']['full_name']
        new_datetime = datetime.strftime(
            datetime.strptime(tweet['created_at'],'%a %b %d %H:%M:%S +0000 %Y'), 
            '%Y-%m-%d %H:%M:%S'
        )
        text = tweet['text']

        requests.post(DB_url, json={
            'tweet_id': tweet_id,
            'place': place,
            'time': new_datetime,
            'text': text,
        })
    except:
        fail_cnt += 1
print(fail_cnt)