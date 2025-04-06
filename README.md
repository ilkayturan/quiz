# quiz
 test
Step 1
Initially the population should come selected the first option and its’ first sub option and the population should be that initially not zero or null
The 4B and 5B products should be hidden in step1 but when the 4A and 5A inputs should update both initialCost for each. If user updates the 5A cost input as 500, the 5B initialCost should be 500, same for 4A to 4B as well
The input is initialCost
costPerPatient will get the updated initialCost and multiplier from products data and make this calculation backend
costPerPatient = initialCost * multiplier

step2 first table
We will see all the products here even the hidden ones 4B and 5B in the first column.
Second column will be costPerResponder for each product, easiMultiplier will be used from products data when user change the related dropdown option
costPerResponder = (costPerPatient / easiMultiplier) * 100

Third column will have costPerPopulation for each product 
costPerPopulation = costPerResponder * selectedPopulation
Last column is “usage” in the products data, users can update it by adding numbers to the input in the last column
Each product should have this usagePerPatient =  costPerPatient * (usage / 100)

Step2 Averages Table 
This is not related to products. We will group the similar products here and use formulas
first column will be like this for each product set except 3A since it doesn’t have complimentary product,
averagePerResponder(1AB) = userPerPatient(1A) + userPerPatient(1B)
averagePerResponder(3A) = userPerPatient(3A)
Second column will be like below
averagePerPopulation= averagePerResponder(for product group) * selectedpopulation

Step 3

First column will be group names of the products, group sets will be shown as one for example for product 1A and 1B it will only show one element “Abrocitinib”
the second column will be percentage of the selected population and third column will be used in this formula in backend
patientNumber1 = (currentUsage / 100) * selectedPopulation
The third column will be 
acquisitionPerResponder = averagePerResponder(1AB) * patientNumber1
The fourth column will be used in formula this  in backend
patientNumber2 = (potentialUsage / 100) * selectedPopulation
The last column will be 
acquisitionPerResponder = averagePerResponder(1AB) * patientNumber1

can you put everything together and use the existing script.js as base and products data while doing that, it's working fine now mostly we just need to connect the elements to each other
