import os
import yaml

nodejsPath = 'edge/nodejs/'
pythonPath = 'edge/python/'
dependabotConfig = '.github/dependabot.yml'

def generateDir(rootPath, appPath):
	return rootPath + appPath + '/' + appPath

def generateConfig():
	config = []
	nodejsAppPaths = os.listdir(nodejsPath)
	for appPath in nodejsAppPaths:
		if os.path.isdir(nodejsPath + appPath):
			config.append({'package-ecosystem': 'npm', 'directory': generateDir(nodejsPath, appPath), 'schedule': {'interval': 'daily'}})

	pythonAppPaths = os.listdir(pythonPath)
	for appPath in pythonAppPaths:
		if os.path.isdir(pythonPath + appPath):
			config.append({'package-ecosystem': 'pip', 'directory': generateDir(nodejsPath, appPath), 'schedule': {'interval': 'daily'}})
	return config

# clear the file
open(dependabotConfig, 'w').close()

initData = dict(
    version = 2,
    updates = []
)

with open(dependabotConfig, 'w') as outfile:
    yaml.dump(initData, outfile, default_flow_style=False)

with open(dependabotConfig) as f:
    newfile = yaml.load(f, Loader=yaml.SafeLoader)

newfile["updates"] = generateConfig()

with open(dependabotConfig, "w") as f:
    yaml.dump(newfile, f, default_flow_style=False)


