var Cap = require("cap").Cap;
var decoders = require("cap").decoders;
var PROTOCOL = decoders.PROTOCOL;


var c = new Cap();
var device = Cap.findDevice("192.168.2.17");// Se coloca la dirección IP del dispositivo local dentro de la red
var filter = "tcp"; //Se filtra los protocolos que se desean capturar, para este caso el protocolo TCP
var bufSize = 10 * 1024 * 1024;
var buffer = Buffer.alloc(65535);

var linkType = c.open(device, filter, bufSize, buffer);
console.log(linkType);

c.setMinBytes && c.setMinBytes(0);

c.on("packet", function (nbytes, trunc) {
  console.log(
    "packet: length " + nbytes + " bytes, truncated? " + (trunc ? "yes" : "no")
  ); //Cada vez que se detecte un paquete saltara el evento y mostrará su respectiv información

  if (linkType === "ETHERNET") {
    var ret = decoders.Ethernet(buffer);

    if (ret.info.type === PROTOCOL.ETHERNET.IPV4) {
      console.log("Decoding IPv4 ...");

      ret = decoders.IPV4(buffer, ret.offset);
      console.log("from: " + ret.info.srcaddr + " to " + ret.info.dstaddr); //Se recogen las direcciones de origen y destino mediante el protocolo 802.3 o 802.11
      if (ret.info.protocol === PROTOCOL.IP.TCP) {
        var datalen = ret.info.totallen - ret.hdrlen;

        console.log("Decoding TCP ...");

        ret = decoders.TCP(buffer, ret.offset);
        console.log(
          " from port: " + ret.info.srcport + " to port: " + ret.info.dstport //Se recogen los puertos origen y destino en la comunicación
        );
        datalen -= ret.hdrlen;
        console.log(
        buffer.toString("binary", ret.offset, ret.offset + datalen)
        ); //Se muestra toda la información del paquete
      } else
        console.log(
          "Unsupported IPv4 protocol: " + PROTOCOL.IP[ret.info.protocol]
        );
    } else
      console.log("Unsupported Ethertype: " + PROTOCOL.ETHERNET[ret.info.type]);
  }
});
