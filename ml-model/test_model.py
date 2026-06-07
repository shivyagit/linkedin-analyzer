import pickle

model = pickle.load(open("model.pkl", "rb"))
vectorizer = pickle.load(open("vectorizer.pkl", "rb"))

resume = "Java developer with Spring Boot and SQL"
job = "Looking for backend developer with Java and Microservices"

text = resume + " " + job
vec = vectorizer.transform([text])

score = model.predict(vec)[0]

print("Match Score:", round(score * 100, 2))