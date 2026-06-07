import pandas as pd

# Load dataset
df = pd.read_csv("resume_data_clean.csv")

# Fill missing values
df = df.fillna("")

# Create resume_text
df["resume_text"] = (
    df["skills"].astype(str) + " " +
    df["responsibilities"].astype(str) + " " +
    df["passing_years"].astype(str)
)

# Create job_description
df["job_description"] = (
    df["job_position_name"].astype(str) + " " +
    df["skills_required"].astype(str) + " " +
    df["responsibilities.1"].astype(str)
)

# Keep only required columns
final_df = df[["resume_text", "job_description", "matched_score"]]

# Save new dataset
final_df.to_csv("combined_dataset.csv", index=False)

print("✅ Dataset ready!")