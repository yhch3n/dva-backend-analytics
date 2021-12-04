from datetime import datetime, date
import random

random.seed(0) # random seed


output_csv = "dummy_data.csv"
n_rows = 20000


# states
# exclude american samoa, guam, northern mariana is, puerto rico, virgin islands
states = ["AL","AK","AZ","AR","CA","CO","CT","DE","DC",
"FL","GA","HI","ID","IL","IN","IA","KS","KY","LA","ME",
"MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ",
"NM","NY","NC","ND","MP","OH","OK","OR","PA","RI","SC",
"SD","TN","TX","UT","VA","WA","WV","WI","WY"]
# print(len(states)) # should be 51 (50 states + DC)

# get random timestamp
start_date_string = "01-01-2020"
end_date_string = "11-01-2021"
date_string_pattern = "%m-%d-%Y"
start_date = datetime.strptime(start_date_string, date_string_pattern)
start_timestamp = int(datetime.timestamp(start_date))
end_date = datetime.strptime(end_date_string, date_string_pattern)
end_timestamp = int(datetime.timestamp(end_date))
# print(start_timestamp, end_timestamp)

# sentiment
# a real number
min_sentiment = -1.0
max_sentiment = 1.0
var_sentiment = 0.15

# make dummy data sorted by timestamp
ts = sorted([random.randrange(start_timestamp, end_timestamp) for i in range(n_rows)])

# make different states different sentiments
states_sentiment = {x:random.uniform(min_sentiment, max_sentiment) for x in states}

with open(output_csv, 'w') as f:
	columns = ["id","sentiment","state","timestamp"]
	header_string = ",".join(columns)
	f.write(header_string + "\n")
	row = {}
	for i,t in enumerate(ts):
		row["id"] = i+1
		row["state"] = random.choice(states)
		tmp = states_sentiment[row["state"]] + random.uniform(-var_sentiment, var_sentiment)
		row["sentiment"] = "%.4f" % min(max(tmp,min_sentiment),max_sentiment)
		row["timestamp"] = t
		row_string = ",".join([str(row[x]) for x in columns])
		f.write(row_string + "\n")

print('writing output to', output_csv)

