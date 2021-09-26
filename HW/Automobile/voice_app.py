import requests
import base64
import json


url = "https://korea.api.thinqai.net:443"
tokenIssueUrl = "https://oauth.api.thinqai.net:443"
apiKey = "MTthM2U4NTRkNTBiMDg0NDkzOGQyYWM4NjgyZjQ0M2ZlZTsxNjI3MDQ3MTU1NzEy"
clientId = "53lq199hldfefpc4g40nkr3444"
clientPw = "1gil8cn1sdhlqjok10d3ke4pp2bre4c3t95ncmu2b2fsnpnrnkub"
idPw = clientId+':'+clientPw
idPw = base64.b64encode(idPw.encode('utf-8'))
print(idPw)
encodedString = ('Basic ').encode('utf-8') + idPw
print(encodedString)
# accessToken = ''
isTokenExpired = True


def getToken():
    headers = {
    "Authorization" : encodedString.decode('utf-8'),
    "Content-type" : "application/x-www-form-urlencoded"
}
    response = requests.post(tokenIssueUrl + '/v1/cognito', headers=headers)
    print(response.status_code)
    global accessToken
    accessToken = response.json()["access_token"]
    # print(accessToken)
    

def reqASR():
    # print(accessToken)
    headers = {
    "x-api-key" : apiKey,
    "Authorization" : accessToken,
    "Content-type" : "application/json"
    }

    data = {
    "type":"dictation",
    "input":{
        "languageCode":"ko-KR",
        "audioConfig":{
            "encoding":"pcm",
            "channels":"1",
            "sampleRate":"16000"
        },
        "triggerWordConfig":{
            "triggerWord":"",
            "skipBytes":"0",
            "epd":"server",
            "enableKeywordReject":False,
            "needKwdResult":False
        }
    },
    "agentConfig":{
   
    },
    "engineConfig":{
        "appName":"<NEED TO REQUEST>",
        "customKey":"<NEED TO REQUEST>",
        "engine":"lgasr",
        "version":"2.0",
        "enablePartialResult":False,
        "enablePcmDump":False,
        "enableDeveloperOption":False,
        "nBest":"1"
    },
    "device":{
        "deviceId":"<NEED TO REQUEST>",
        "deviceType":"<NEED TO REQUEST>",
        "userId":"<NEED TO REQUEST>"
    },
    "additionalConfig":{
           
    }
}
    res = requests.post(url + "/voice/stt/v1/dictation/downstream", data=json.dumps(data),headers=headers)
    print(res.status_code)
    #response type: 1. content 2. text 3. json
    # print(res.content)
    print(res.json())
    # res = json.loads(res.text) 
    # 

def reqTTS():
    headers = {
    "x-api-key" : apiKey,
    "Authorization" : accessToken,
    "Content-type" : "application/json;charset=UTF-8"
    }

    data = {
    "type": "SYNTHESIS",
    "input": {
        "text": "사용자 인증이 완료되었습니다",
        "type": "Plain Text"
    },
    "voiceConfig": {
        "speaker": "Female1",
        "speed": "Medium",
        "languageCode": "ko_KR",
        "effect": "None",
        "volume": "Volume 4",
        "pitch": "Normal"
    },
    "audioConfig": {
        "encoding": "MP3"
    },
    "additionalConfig": {
        "privacy": "yes"
     }
    }
    res = requests.post(url + "/voice/tts/v1/synthesis", data=json.dumps(data),headers=headers)

getToken()
# reqASR()

reqTTS()

