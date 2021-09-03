# <p align="center">2021 Embedded Software Contest webOS <br> 3007-ACOLYTE</p>

<p align="center">
  <img width="360" src="img/Icons/main_image.png">
</p>

## Who are we, and what are we aiming for?

**Who are we?**
> &nbsp;&nbsp;**'@bammPark - AIdev •Team Leader'** is a team leader. He will be working on Yolo model plan design, applying LG ThinQ AI service(Audio filtering and Facial detection) to the project. <br><br>
> &nbsp;&nbsp;**'@MarcoBackman - SWdev • Collaborator'** is a SW developer. He will be handling a webOS application that requires html, css, js and database management system language skills.  <br><br>
> &nbsp;&nbsp;**'@JuneKoo Kang - engineerjkk • Collaborator'** is a embedded developer. He will be handling ESP8266 hardware devices to recieve and send raw data over the network, and will handle PCB design and overall product ordering.   <br><br>
> &nbsp;&nbsp;**'@submarine214 - supporter • Collaborator'** is a documenter/editor/tester. He will support us on overall workloads; especially focusing on documentation and testing. <br><br>


**What is the ultimate goal of this project?**
> &nbsp;&nbsp; The purpose of our development is to create a diverse and integrated system which involves overarching trends in Internet of Things(IoT). This project distinguishes from other features in associative automotive function with flexible finance distribution system in shared living environment.


## About our project<br>

&nbsp;&nbsp;The operating system is based on webOS system from LG, and we build the app that runs on it. Eventually, the the operating system that contains our developed app will run on Raspberry pi 4 machine with additional external devices connected to it(Touch monitor, sensers, voice receivers, wireless connection device, etc).
<br>
&nbsp;&nbsp; In general, this project is conprised of two major sections: Hardware and Software.
<br>
&nbsp;&nbsp; In the software section, we build an application program that suits well under webOS system architecture, regardless of its low level knowledge (e.g. kernal level, shell development).
<br>
&nbsp;&nbsp; Our development will only pursuit on logic architecture of the webpage, which is a webOS app, and visualization of the database that stores data from hardware system.
<br>

### Project regulations and Encodings.
> We have our own project regulation for developers. Please check the link: [Code Styles](https://github.com/MarcoBackman/2021ESWContest_webOS_3007/blob/main/document/webOS/Code_Style.md)
<br><br>
> We strickly regulate our code encoding to be in UTF-8 format. Use of any encoding format other then UTF-8 will be prohibited.

## To Do list
&nbsp;&nbsp; **'@bammPark'** and **'@JuneKoo Kang'** are currently preparing on thinQ AI processing and designing embedded system. - See: [HW 부문 계획](https://github.com/MarcoBackman/2021ESWContest_webOS_3007/projects/2)
<br><br>
&nbsp;&nbsp; **'@MarcoBackman'** is currently working on webOS applications. Estimated overall job end-date is August 30th. Still working on DB connection via web app.<br>
&nbsp;&nbsp; For detailed progress, see: [webOS webpage progress](https://github.com/MarcoBackman/2021ESWContest_webOS_3007/projects/1).<br>
&nbsp;&nbsp; For dev logs on SW and DB, see: [codeprojectnow](https://codeprojectnow.blogspot.com/).<br>
<br>

## Milestone.

<p align="center">
  <img width="600" src="img/MilestoneNew.PNG">
  <p align="center">[Milestone Image]</p>
</p>

## Overall technical diagram.
<p align="center">
  <img width="660" src="img/overallDiagram.PNG">
  <p align="center">[Entire project diagram.]</p>
</p>

## Logic flow of webOS application.

<p align="center">
  <img width="960" src="img/WebOS_WebPage.png">
  <p align="center">[Logic flow for home webOS app.]</p>
  <p style="color:red;" align="left">Red   - Indicates unimplemented work &#x1F44E;</p>
  <p style="color:orange;" align="left">Orange- Indicates to do work in soon &#x1F44C;</p>
  <p style="color:green;" align="left">Green - Indicates implemented work &#x1F44D;</p>
</p>

## Database overall design.

<p align="center">
  <img width="960" src="img/webOS_DB_structure.png">
  <p align="center">[atabase architecture]</p>
  <p style="color:red;" align="left">Red   - Indicates unimplemented work &#x1F44E;</p>
  <p style="color:green;" align="left">Green - Indicates implemented work &#x1F44D;</p>
</p>

## Notices

> Some of the settings in the database and codes are bug-prone and has a lot of security issues such as injection attack.<br><br>
> However, this project mainly focuses on the IoT presentation instead of considering security and code details due to lack of development time.
