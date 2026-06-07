import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import train_test_split
import pickle

# Load dataset
df = pd.read_csv("combined_dataset.csv")

# Combine text
df["text"] = df["resume_text"] + " " + df["job_description"]

# Features & labels
X = df["text"]
y = df["matched_score"]

# Convert text → vectors
vectorizer = TfidfVectorizer(max_features=3000)
X_vec = vectorizer.fit_transform(X)

# Split data (VERY IMPORTANT 🔥)
X_train, X_test, y_train, y_test = train_test_split(X_vec, y, test_size=0.2, random_state=42)

# Train model
model = RandomForestRegressor(n_estimators=100)
model.fit(X_train, y_train)

# Evaluate model
score = model.score(X_test, y_test)
print("Model Accuracy (R² score):", score)

# Save model
pickle.dump(model, open("model.pkl", "wb"))
pickle.dump(vectorizer, open("vectorizer.pkl", "wb"))

print("✅ Model trained and saved!")