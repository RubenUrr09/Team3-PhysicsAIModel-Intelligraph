
# Cases to cover for the AI model to work efficiently:

    ## Natural Language Processing (NLP)
        # HELP THE PROGRAM SOLVE WHATEVER IT IS SUPPOSED TO SOLVE -> What's the .x.? Solve for .x. 
        # Make sure the program answers questions in English (Look at the json files just to make sure it doesn't switch to other languages like french, german, etc)


    ## Stuff easy to compute /add
        # Converting from ALL TYPES OF UNITS (Look at a unit Table) (In to m, cm to m, degrees to radians, and others (VICEVERSA FOR EACH ONE TOO, there should be an easy way to not do it two times)
        # Using other relationships from past chapters to solve torque problems (Relation between linear and rotational problems etc)
        # Add Angular momentum problems (t = Iw) adn implement a formula that recongnizes moment of inertia based on shapes, and angular speed
        # Add physics constants that can be used when solving these types of problems

        # Most likely using NumPy:
            # Make sure the program can solve INTEGRALS, take DERIVATIVES for a variable that is needed
            # Make sure the program deals well with VECTOR CALCULUS, can take derivatives and integrals of vectors, take 


    ## Tricky stuff for the machine to realize or imagine:
        # Make sure it changes signs if stated clockwise or counterclockwise
        # Also angles depend the perspective seen, make sure to make a general formula based on keywords (Seen from the top, seen from the bottom, etc)
        # that subtract the angle accordingly for the machine to use properly
        # Make the program recognize LEFT HAND AND RIGHT RULE, make a bunch of if statements such that: If torque points this way, then the force points this way etc (vector T = vector R x vector F)


        # Differentiaite between Static equilibrium vs NET TORQUE problems
        # Using all equations at the same time to solve problems (EX. Using Angular momentum AND Torque to solve for another missing variable)
        # Make sure that, if no variables are recognized, the program says "There's not enough information"
        # Make sure the program recognizes Forces hitting the pivot as 0m * F = 0N*m (Torque)

training_data = [    

        # Very basic problems
        {"input_text": "Physics Formulas: Torque (τ, Nm) = Force (F, N) * Distance (r, m). Solve: A force of 10 Newtons is applied at a distance of 2 meters from the pivot.",
         "output_text": "Torque = 10 N * 2 m = 20 Nm"},
        {"input_text": "Physics Formulas: Torque (τ, Nm) = Force (F, N) * Distance (r, m). Solve: A 5N force acts on a 4m lever. Calculate torque.",
         "output_text": "Torque = 5 N * 4 m = 20 Nm"},
        {"input_text": "Physics Formulas: Torque (τ, Nm) = Force (F, N) * Distance (r, m). Solve: A 15 Newton force is applied at 3 meters from the pivot.",
         "output_text": "Torque = 15 N * 3 m = 45 Nm"},
        {"input_text": "Physics Formulas: Torque (τ, Nm) = Force (F, N) * Distance (r, m). Solve: What is the torque when a 7N force is applied at a distance of 6m?",
         "output_text": "Torque = 7 N * 6 m = 42 Nm"},
        {"input_text": "Physics Formulas: Torque (τ, Nm) = Force (F, N) * Distance (r, m). Solve: A force of 20N acts at a distance of 1.5m from the pivot.",
         "output_text": "Torque = 20 N * 1.5 m = 30 Nm"},
        
        
        # Basic problems with angles
        {"input_text": "Physics Formulas: Torque (τ, Nm) = Force (F, N) * Distance (r, m) * sin(θ). Solve: A 12N force acts at 45 degrees on a 3m lever arm.",
         "output_text": "Torque = 12 N * 3 m * sin(45°) = 12 N * 3 m * 0.7071 = 25.46 Nm"},
        {"input_text": "Physics Formulas: Torque (τ, Nm) = Force (F, N) * Distance (r, m) * sin(θ). Solve: Calculate the torque when a 25N force acts at 30° on a 2m bar.",
         "output_text": "Torque = 25 N * 2 m * sin(30°) = 25 N * 2 m * 0.5 = 25 Nm"},


        # More complex problems, rearranging variables
        {"input_text": "Physics Formulas: Torque (τ, Nm) = Force (F, N) * Distance (r, m). Solve: Calculate the force needed to produce 60Nm of torque with a 3m wrench.",
         "output_text": "Force = Torque ÷ Distance = 60 Nm ÷ 3 m = 20 N"},
        {"input_text": "Physics Formulas: Torque (τ, Nm) = Force (F, N) * Distance (r, m) * sin(θ). Solve: A 40N force acts at 60° on a lever. The torque is 60Nm. What is the lever length?",
         "output_text": "Lever length = Torque ÷ (Force * sin(θ)) = 60 Nm ÷ (40 N * sin(60°)) = 60 Nm ÷ (40 N * 0.866) = 1.73 m"},
         
        # Units conversion problems
        {"input_text": "Physics Formulas: Torque (τ, Nm) = Force (F, N) * Distance (r, m). Solve: A 2 kg mass hangs from a 50 cm lever arm. Calculate the torque.",
         "output_text": "Force = mass * gravity = 2 kg * 9.8 m/s² = 19.6 N\nDistance = 50 cm = 0.5 m\nTorque = 19.6 N * 0.5 m = 9.8 Nm"},
]