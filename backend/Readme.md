# How to start

Start a docker server

```bash
docker run -d -p 27017:27017 --name mongodb --rm mongo
```

`--rm` command will just delete the docker image when it exits
