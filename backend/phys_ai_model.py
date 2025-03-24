import os
import shutil
import torch
import re
from transformers import T5ForConditionalGeneration, T5Tokenizer
from torch.utils.data import Dataset, DataLoader
from transformers import AdamW
import math
from torque_training_data import training_data

MODEL_PATH = "fine_tuned_t5"

# Enhanced model loading with better path verification
print(f"Current working directory: {os.getcwd()}")
print(f"Checking for model at: {os.path.abspath(MODEL_PATH)}")

if os.path.exists(MODEL_PATH) and os.path.isdir(MODEL_PATH) and len(os.listdir(MODEL_PATH)) > 0:
    try:
        tokenizer = T5Tokenizer.from_pretrained(MODEL_PATH)
        model = T5ForConditionalGeneration.from_pretrained(MODEL_PATH)
        print(f"Loaded fine-tuned model from {os.path.abspath(MODEL_PATH)}")
        print(f"Model directory contents: {os.listdir(MODEL_PATH)}")
    except Exception as e:
        print(f"Error loading fine-tuned model: {e}")
        tokenizer = T5Tokenizer.from_pretrained("t5-small")
        model = T5ForConditionalGeneration.from_pretrained("t5-small")
        print("Loaded pre-trained T5 model due to error.")
else:
    tokenizer = T5Tokenizer.from_pretrained("t5-small")
    model = T5ForConditionalGeneration.from_pretrained("t5-small")
    print("Loaded pre-trained T5 model (no fine-tuned model found).")

device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
model = model.to(device)

def delete_old_model():
    if os.path.exists(MODEL_PATH):
        try:
            shutil.rmtree(MODEL_PATH)
            print(f"Successfully deleted old model at {os.path.abspath(MODEL_PATH)}")
        except PermissionError:
            print("PermissionError: Could not delete old model. Make sure no files are open.")
        except Exception as e:
            print(f"Error deleting old model: {e}")

# Variable extraction functions for different physics problems
def extract_torque_variables(question):
    """Extract force, distance, and angle variables from the question for torque calculation."""
    # Extract force in Newtons (handles variants like 10N, 10 N, 10 Newtons)
    force_match = re.search(r'(\d+(?:\.\d+)?)\s*(?:N|Newton|Newtons)', question, re.IGNORECASE)
    
    # Extract distance in meters (handles variants like 2m, 2 m, 2 meters)
    distance_match = re.search(r'(\d+(?:\.\d+)?)\s*(?:m|meter|meters)', question, re.IGNORECASE)
    
    # Extract angle in degrees (handles variants like 30°, 30 degrees)
    angle_match = re.search(r'(\d+(?:\.\d+)?)\s*(?:°|degree|degrees)', question, re.IGNORECASE)
    
    # Extract torque in Newton-meters (handles variants like 20Nm, 20 Nm)
    torque_match = re.search(r'(\d+(?:\.\d+)?)\s*(?:Nm|N·m|Newton[ -]meter)', question, re.IGNORECASE)
    
    # Extract mass in kilograms (handles variants like 5kg, 5 kg, 5 kilograms)
    mass_match = re.search(r'(\d+(?:\.\d+)?)\s*(?:kg|kilogram|kilograms)', question, re.IGNORECASE)
    
    # Extract centimeters and convert to meters
    cm_match = re.search(r'(\d+(?:\.\d+)?)\s*(?:cm|centimeter|centimeters)', question, re.IGNORECASE)
    
    F = float(force_match.group(1)) if force_match else None
    d = float(distance_match.group(1)) if distance_match else None
    
    # Convert centimeters to meters if present
    if cm_match and not distance_match:
        d = float(cm_match.group(1)) / 100.0
    
    # Calculate force from mass if present
    if mass_match and not force_match:
        m = float(mass_match.group(1))
        F = m * 9.8  # F = ma, where a = 9.8 m/s² (gravity)
    
    angle = float(angle_match.group(1)) if angle_match else 90.0  # Default to perpendicular force
    torque = float(torque_match.group(1)) if torque_match else None
    
    return F, d, angle, torque

def calculate_torque(F, d, angle_deg=90):
    """Calculate torque using τ = F * d * sin(θ)"""
    if F is None or d is None:
        return None
    angle_rad = math.radians(angle_deg)
    return F * d * math.sin(angle_rad)

def calculate_force(torque, d, angle_deg=90):
    """Calculate force using F = τ / (d * sin(θ))"""
    if torque is None or d is None:
        return None
    angle_rad = math.radians(angle_deg)
    return torque / (d * math.sin(angle_rad))

def calculate_distance(torque, F, angle_deg=90):
    """Calculate distance using d = τ / (F * sin(θ))"""
    if torque is None or F is None:
        return None
    angle_rad = math.radians(angle_deg)
    return torque / (F * math.sin(angle_rad))

def analyze_physics_problem(question):
    """Analyze the physics problem, extract variables, and provide calculated answer."""
    F, d, angle, torque = extract_torque_variables(question)
    
    result = {
        "variables": {
            "force": F,
            "distance": d,
            "angle": angle,
            "torque": torque
        },
        "calculations": {},
        "missing": []
    }
    
    # Check what variables we have and what we need to calculate
    if torque is None and F is not None and d is not None:
        result["calculations"]["torque"] = calculate_torque(F, d, angle)
    elif F is None and torque is not None and d is not None:
        result["calculations"]["force"] = calculate_force(torque, d, angle)
    elif d is None and torque is not None and F is not None:
        result["calculations"]["distance"] = calculate_distance(torque, F, angle)
    
    # Identify missing variables
    if F is None:
        result["missing"].append("force")
    if d is None:
        result["missing"].append("distance")
    if torque is None:
        result["missing"].append("torque")
    
    return result

def get_answer(question):
        # First analyze the question to extract physics variables
    analysis = analyze_physics_problem(question)

    # Format detected variables
    response_text = ["Detected variables:"]
    for var_name, var_value in analysis["variables"].items():
        if var_name == "torque":
            response_text.append(f"- {var_name.capitalize()}: {var_value if var_value is not None else 'Unknown'} N*m")
            t = var_value
        if var_name == "force":
            response_text.append(f"- {var_name.capitalize()}: {var_value if var_value is not None else 'Unknown'} N")
            f = var_value
        if var_name == "distance":
            response_text.append(f"- {var_name.capitalize()}: {var_value if var_value is not None else 'Unknown'} m")
            d = var_value
        if var_name == "angle":
            response_text.append(f"- {var_name.capitalize()}: {var_value if var_value is not None else 'Unknown'} °")
            a = var_value

    # Format calculated values
    if analysis["calculations"]:
        response_text.append("\nCalculated values:")
        for calc_name, calc_value in analysis["calculations"].items():
            if var_name == "torque":
                response_text.append(f"- τ = F * d * sin(θ) = {f}N * {d}m * sin({a}°) = {calc_name.capitalize()} = {calc_value:.2f} N*m")
            elif var_name == "force":
                response_text.append(f"- {calc_name.capitalize()} = {calc_value:.2f} N")
            elif var_name == "distance":
                response_text.append(f"- {calc_name.capitalize()} = {calc_value:.2f} m")

    # Use AI model to generate an additional explanation
    formula_context = "Physics Formulas: Torque (τ, Nm) = Force (F, N) * Distance (r, m) * sin(θ)."
    input_text = f"{formula_context} Solve: {question}"

    input_ids = tokenizer(input_text, return_tensors="pt").input_ids.to(device)

    output_ids = model.generate(
        input_ids, 
        max_length=150,
        num_beams=5,
        no_repeat_ngram_size=2,
        early_stopping=True
    )

    ai_answer = tokenizer.decode(output_ids[0], skip_special_tokens=True)
    response_text.append(f"\n Additional AI Model Answer (TRAIN IT): {ai_answer}")

    # Return formatted response
    return "\n".join(response_text)

# Fine-tune the model with user corrections and structured unit-based training data
def fine_tune():
    print("Starting fine-tuning process...")
    
    train_data = []

    # Load user corrections
    if os.path.exists("user_corrections.txt"):
        with open("user_corrections.txt", "r") as f:
            for line in f:
                try:
                    question, corrected_answer = line.strip().split("\t")
                    train_data.append({
                        "input_text": f"Physics Formulas: Torque (τ, Nm) = Force (F, N) * Distance (r, m). Solve: {question}",
                        "output_text": corrected_answer
                    })
                except ValueError:
                    print(f"Skipping malformed correction: {line.strip()}")

    # Comprehensive training data with explicit units - using * for multiplication
    precomputed_data = training_data

    train_data.extend(precomputed_data)

    if not train_data:
        print("No valid training data found.")
        return

    print(f"Training with {len(train_data)} examples.")
    delete_old_model()

    class PhysicsDataset(Dataset):
        def __init__(self, data):
            self.data = data

        def __len__(self):
            return len(self.data)

        def __getitem__(self, idx):
            item = self.data[idx]
            input_encoding = tokenizer(item["input_text"], 
                              return_tensors="pt", 
                              padding="max_length", 
                              truncation=True, 
                              max_length=128)
            
            output_encoding = tokenizer(item["output_text"], 
                               return_tensors="pt", 
                               padding="max_length", 
                               truncation=True, 
                               max_length=128)
            
            input_ids = input_encoding.input_ids.squeeze()
            attention_mask = input_encoding.attention_mask.squeeze()
            labels = output_encoding.input_ids.squeeze()
            
            return {
                "input_ids": input_ids, 
                "attention_mask": attention_mask, 
                "labels": labels
            }

    dataset = PhysicsDataset(train_data)
    dataloader = DataLoader(dataset, batch_size=2, shuffle=True)

    # Use a lower learning rate for better stability
    optimizer = AdamW(model.parameters(), lr=1e-5)
    model.train()

    # More epochs for better learning
    num_epochs = 10
    for epoch in range(num_epochs):
        total_loss = 0
        num_batches = 0
        
        for batch in dataloader:
            input_ids = batch["input_ids"].to(device)
            attention_mask = batch["attention_mask"].to(device)
            labels = batch["labels"].to(device)

            optimizer.zero_grad()
            outputs = model(
                input_ids=input_ids,
                attention_mask=attention_mask,
                labels=labels
            )
            
            loss = outputs.loss
            loss.backward()
            optimizer.step()
            
            total_loss += loss.item()
            num_batches += 1
        
        avg_loss = total_loss / num_batches
        print(f"Epoch {epoch + 1}/{num_epochs} completed. Average Loss: {avg_loss:.4f}")

    # Save model and tokenizer
    try:
        model.save_pretrained(MODEL_PATH)
        tokenizer.save_pretrained(MODEL_PATH)
        print(f"Fine-tuning complete. Model saved to {os.path.abspath(MODEL_PATH)}")
        print(f"Model directory contents: {os.listdir(MODEL_PATH)}")
    except Exception as e:
        print(f"Error saving model: {e}")

    # Test the model on a sample problem
    print("\nTesting fine-tuned model on a sample problem:")
    model.eval()
    test_question = "A 15N force is applied perpendicular to a 2m lever. Calculate the torque."
    
    # First test our variable extraction
    print("Testing variable extraction:")
    test_analysis = analyze_physics_problem(test_question)
    print(f"Extracted variables: {test_analysis['variables']}")
    if test_analysis["calculations"]:
        print(f"Calculated: {test_analysis['calculations']}")
    
    # Then test the model
    formula_context = "Physics Formulas: Torque (τ, Nm) = Force (F, N) * Distance (r, m)"
    test_input = f"{formula_context} Solve: {test_question}"
    
    test_input_ids = tokenizer(test_input, return_tensors="pt").input_ids.to(device)
    
    with torch.no_grad():
        test_output_ids = model.generate(test_input_ids, max_length=100)
        test_output = tokenizer.decode(test_output_ids[0], skip_special_tokens=True)
    
    print(f"Test Question: {test_question}")
    print(f"Model Answer: {test_output}")

