### Environment
Requires Docker installed and running
### Build docker image and run
```
cd src
docker-compose build --no-cache
docker-compose up
```
You should then be able to check service with URL `http://localhost:5000/`
### Clean docker related file and re-build docker image and run:
```
docker-compose down
docker system prune
docker container ls -a
docker volume rm $(docker volume ls -q)
docker volume ls
docker rmi $(docker images -a -q)
docker images -a

docker-compose build --no-cache &&
docker-compose up
```
### Use `ngrok` to expose the localhost
With an aid of `ngrok` software, we could expose the localhost with a interim domain name, so that our app on the phone can access it from public network.
1. Go to [ngrok](https://ngrok.com/) to create account and download the software zip
2. unzip the file
3. Go to the directory the `ngrok` file located and run below command:
```
./ngrok config add-authtoken your-key-from-the-ngrok-website
./ngrok http 5000
```
