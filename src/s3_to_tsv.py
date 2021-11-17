import boto3
import json
from tqdm import tqdm
from datetime import date, datetime
import urllib.request
import requests
import os
import re
import pandas as pd
import csv
import geopy
from geopy.geocoders import Photon
import traceback


locator = Photon(user_agent="measurements")

s3 = boto3.resource('s3')
s3_client = boto3.client('s3')
BUCKET = "cse6242-team005"
TWEET_DIR = "tweets"
my_bucket = s3.Bucket(BUCKET)

SENTIMENT_DIR_2020 = "COVID19_Tweets_Dataset_2020/Summary_Sentiment"
SENTIMENT_DIR_2021 = "COVID19_Tweets_Dataset/Summary_Sentiment"
url_template_2021 = "https://raw.githubusercontent.com/lopezbec/COVID19_Tweets_Dataset/main/Summary_Sentiment/2021_{}/2021_{}_{}_{}_Summary_Sentiment.csv"
url_template_2020 = "https://raw.githubusercontent.com/lopezbec/COVID19_Tweets_Dataset_2020/master/Summary_Sentiment/2020_{}/2020_{}_{}_{}_Summary_Sentiment.csv"

def retrieve_and_upload(y_m_d_h):
    y, m, d, h = y_m_d_h
    if y == "2020":
        SENTIMENT_DIR = SENTIMENT_DIR_2020
        url_template = url_template_2020
    elif y == "2021":
        SENTIMENT_DIR = SENTIMENT_DIR_2021
        url_template = url_template_2021
    else:
        raise
    url = url_template.format(m, m, d, h)
    filename = f"{y}_{m}_{d}_{h}_Summary_Sentiment.csv"
    try:
        urllib.request.urlretrieve(url, f"/tmp/{filename}")
        s3.Bucket(BUCKET).upload_file(f"/tmp/{filename}", f"{SENTIMENT_DIR}/{y}_{m}/{filename}")
        # os.remove(f"/tmp/{filename}")
    except:
        import traceback
        print(traceback.format_exc())
        print("Not found", url)

    return

DB_url = "http://localhost:5000/push_tweet"
with open('states_code.json', 'r') as f:
    state_code = json.load(f)
    rev_state_code = {v:k for k, v in state_code.items()}

def datetime_to_sentiment_url(time_str):
    YMD, hms = time_str.split()
    Y, M, D = YMD.split('-')
    h, m, s = hms.split(':')
    if Y == '2020':
        SENTIMENT_DIR = "COVID19_Tweets_Dataset_2020/Summary_Sentiment"
        csv = f'{SENTIMENT_DIR}/{Y}_{M}/{Y}_{M}_{D}_{h}_Summary_Sentiment.csv'
    elif Y == '2021':
        SENTIMENT_DIR = "COVID19_Tweets_Dataset/Summary_Sentiment"
        # I named the csv file wrongly when I uploaded to s3
        csv = f'{SENTIMENT_DIR}/{Y}_{M}/{Y}_{M}_{D}_{h}_Summary_Details.csv'
    return csv

uploaded = set()
uploaded_file = "uploaded_tweets.txt"
if os.path.exists(uploaded_file):
    with open(uploaded_file, 'r') as f:
        uploaded = set(f.read().split('\n')[:-1])
downloaded = set()
output_tsv = 'all_twitter_data.tsv'
if os.path.exists(output_tsv):
    df = pd.read_csv(output_tsv, delimiter='\t')
    downloaded = set(df['tweet_id'])

def get_id(tweet):
    tweet_id = tweet['id_str']
    return tweet_id

def get_state_code(tweet):
    try:
        if tweet.get('place') and 'full_name' in tweet['place']:
            place = tweet['place']['full_name']
            tweet_location = place.split(',')
            tweet_state = tweet_location[0].strip()
            if tweet_state in state_code:
                return tweet_state
            tweet_state = tweet_location[1].strip()
            if tweet_state in state_code:
                return tweet_state
            tweet_state = tweet_location[0].strip()
            if tweet_state in rev_state_code:
                return rev_state_code[tweet_state]
            tweet_state = tweet_location[1].strip()
            if tweet_state in rev_state_code:
                return rev_state_code[tweet_state]
    except:
        print(traceback.format_exc())
        print('tweet state location failed, trying geopy')
        pass
    try:
        if tweet.get('geo') and 'coordinates' in tweet['geo']:
            geo = tweet['geo']['coordinates']
            location = locator.reverse(', '.join([str(g) for g in geo]))
            geopy_state = location.raw['properties']['state']
            if geopy_state in state_code:
                return geopy_state
            if geopy_state in rev_state_code:
                return rev_state_code[geopy_state]
    except:
        print(traceback.format_exc())
        return None
    
    return None

def get_time(tweet):
    new_datetime = datetime.strftime(
        datetime.strptime(tweet['created_at'],'%a %b %d %H:%M:%S +0000 %Y'), 
        '%Y-%m-%d %H:%M:%S'
    )
    return new_datetime

def get_text(tweet):
    text = tweet['text'].replace('\t', ' ')
    text = re.sub(r'[^\x20-\x7E]+', '', text)
    return text

def get_sentiment(tweet):
    sentiment_csv = datetime_to_sentiment_url(get_time(tweet))
    sentiment_local_csv = f'/tmp/{os.path.basename(sentiment_csv)}'
    if not os.path.exists(sentiment_local_csv):
        try:
            s3_client.download_file(BUCKET, sentiment_csv, sentiment_local_csv)
        except:
            print(f"{sentiment_csv} missing; downloading")
            time_str = get_time(tweet)
            YMD, hms = time_str.split()
            Y, M, D = YMD.split('-')
            h, m, s = hms.split(':')
            retrieve_and_upload((Y, M, D, h))
    df = pd.read_csv(sentiment_local_csv)
    try:
        sentiment_label = df[df['Tweet_ID'] == int(get_id(tweet))]['Sentiment_Label'].values[0]
    except:
        sentiment_label = None
    return sentiment_label

def save(all_tweet_data):
    csv_columns = ['tweet_id', 'state', 'time', 'text', 'sentiment']
    file_exists = os.path.isfile(output_tsv)
    with open(output_tsv, 'a') as f:
        writer = csv.DictWriter(f, fieldnames=csv_columns, delimiter='\t')
        if not file_exists:
            writer.writeheader()
        for data in all_tweet_data:
            writer.writerow(data)

with open("all_tweet_ids.txt", 'r') as f:
    all_tweet_ids = f.read().split('\n')

def main():
    fail_cnt = 0
    all_tweet_data = []
    batch_size = 100
    for tweet_obj in tqdm(my_bucket.objects.filter(Prefix=TWEET_DIR)):
        try:
            tweet = json.loads(tweet_obj.get()['Body'].read().decode('utf-8'))
            tweet_id = get_id(tweet)
    #         if int(tweet_id) in downloaded:
    #             continue
            state_code = get_state_code(tweet)
            if not state_code:
                continue
            time = get_time(tweet)
            text = get_text(tweet)
            sentiment = get_sentiment(tweet)

            tweet_data = {
                'tweet_id': tweet_id,
                'state': state_code,
                'time': time,
                'text': text,
                'sentiment': sentiment
            }
            all_tweet_data.append(tweet_data)
            if len(all_tweet_data) == batch_size:
                print('saving')
                save(all_tweet_data)
                all_tweet_data = []
        except Exception as e:
            print(traceback.format_exc())
            fail_cnt += 1
    print(fail_cnt)
    save(all_tweet_data)


if __name__ == '__main__':
    main()
