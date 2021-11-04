'use strict';

const excel = require('excel4node');
const AWS = require('aws-sdk');
const mysql = require('mysql');
const s3 = new AWS.S3();



// Create a new instance of a Workbook class
var workbook = new excel.Workbook();
//   Log  
var worksheet = workbook.addWorksheet("Vigor");

const headingColumnNames = [
    "INCLUSION",
    "FIANZA",
    "IDMON",
    "ABREV",
    "RAMO",
    "SUBRAMO",
    "PRODUCTO",
    "ID_AGENTE",
    "OFICINA",
    "FIADO",
    "ID_FIADO",
    "RFC",
    "TIPO_OP",
    "IDMOV_DIR",
    "NOMOV_DIR",
    "FECHAOP_DIR",
    "DESDE",
    "HASTA",
    "MONTO_DIR",
    "MONTO_REAL",
    "PRIMA_DIR",
    "DERECHOS",
    "GTOSEXP",
    "IVA",
    "BONIF",
    "IVA_BONIF",
    "TOTAL",
    "PORC_COM",
    "COMISION",
    "PB_DIR",
    "RFV_DIR",
    "RC_DIR",
    "PORC_GTOS_ADMIN",
    "GTOS_ADMIN",
    "FECHAOP_CED",
    "IDMOV_CED",
    "NOMOV_CED",
    "IDCIA",
    "CIA",
    "COM_CIA",
    "MONTO_CED",
    "PRIMA_CED",
    "IVA_CD",
    "COMISION_CD",
    "IVA_COM_CD",
    "TOTAL_PAGAR",
    "PB_CED",
    "RFV_CED",
    "RC_CED",
    "VMMR",
    "PDI",
    "TIPO_COB",
    "TIPO_REASEGURO",
    "CALIFICADORA",
    "CALIFICACION",
    "VALOR",
    "REG_CIA",
    "TIPO_CED",
    "FECHA_EJEC",
    "VC_NOTA_TECNICA"
];

module.exports.reporteVigores = (event, context, callback) => {

  	// conexion a RDS mysql.
	const con = mysql.createConnection({
		host: 'bd-vigores.chkksig7q2rm.us-east-2.rds.amazonaws.com',
		database: 'VIGORES',
		user: 'admin',
		password: 'LauFerMar#122020'
	});
// inicia conexion
	con.connect((err) => {
		if (err) throw err;

		// Ejecuta query
		con.query("SELECT * FROM VIGOR_INFO_TOTAL", function (err, VIGOR_INFO_TOTAL, fields) {

			console.log('Se genero correctamente la consulta de los datos.');
			const jsonCustomers = JSON.parse(JSON.stringify(VIGOR_INFO_TOTAL));


            let headingColumnIndex = 1;
                headingColumnNames.forEach(heading => {
                    worksheet.cell(1, headingColumnIndex++).string(heading)
                });

                console.log('Se cargaron correctamente los Headers');
            //llenar tabla 
            let rowIndex = 2;
            jsonCustomers.forEach( record => {
                    let columnIndex = 1;
                    Object.keys(record ).forEach(columnName =>{                   
                        
                        worksheet.cell(rowIndex,columnIndex++).string(JSON.stringify(record[columnName]))
                    });
                    rowIndex++;
                });
		
			console.log('Se genero correctamente el xlsx');
						
			// subir archivo
            let fileName = "folder/" + Date.now() +'Vigores.xlsx';
            console.log('FileName:', fileName);
            let bucketName = 'bucketvigores';
          
            workbook.writeToBuffer().then(function (file_buffer) {
          
              var params = {
                Bucket: bucketName,
                Key: fileName,
                Body: file_buffer
              };
          
              s3.putObject(params, function (err, pres) {
                if (err) {
          
                  callback(err);
          
                } else {
                    
                  const signedUrlExpireSeconds = 86400;// 1 Day
                  const url = s3.getSignedUrl('getObject', {
                    Bucket: bucketName,
                    Key: fileName,
                    Expires: signedUrlExpireSeconds
                  });
                  send_sms(url);
                  console.log('Url : ', url);
          
                  callback(null, url);
          
                }
              });
            });			  

			// cierra conexion a las Base
			con.end(function (err) {
				if (err) {
					return console.log('error:' + err.message);
				}
				console.log('Close the database connection.');
			});

		});
	});

 


};

//Funcion para mandar SMS
function send_sms(mensaje) {
const accountSid = 'AC8720e08375210944bf6681681d20d3b1'; 
const authToken = '9756958ce7b9cf2cdd0134ea72eaaef1'; 
const client = require('twilio')(accountSid, authToken); 
 
client.messages 
      .create({ 
         body: 'Se generaron correctamente el vigor , Este es el link '+mensaje,  
         messagingServiceSid: 'MG945c100ef5406e44d40011e32c5367dc',      
         to: '+527713973025' 
       }) 
      .then(message => console.log(message.sid)) 
      .done();
    
}