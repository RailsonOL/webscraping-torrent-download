const express = require('express')
const cheerio = require('cheerio')
const axios = require('axios')

const app = express()

app.get('/', async(req, resp) => {
try {
  const response = await axios.get('https://comandotorrents.org/')

  let $ = cheerio.load(response.data, { decodeEntities: false })
    
  const filmesTodos = {
    filme: []
  }

  $('article').each(function (index, elem) {
      var El = $(elem)
      var titulo = El.find('h2', '#entry-title').text()
      var link = El.find('a').attr('href').replace('https://comandotorrents.org/', '')
      var informacoesHtml = El.find('p', 'strong').html()
      var informacoes = El.find('p', 'strong').text()
      var img = $(this).find('img').attr('src')

      filmesTodos.filme.push({'titulo': titulo, 'img': img, 'link': link, 'informacoes': informacoes, 'informacoesHtml': informacoesHtml})
  })

  resp.status(200)
  resp.send(filmesTodos)
} catch (e) {

  resp.status(500)
  resp.send(`Algo deu errado, erro: ${e.message}`)
  console.log(e.message)

}
});

//paginas "seguintes"

app.get('/page/:num', async(req, resp) => {
try {

  let numpag = req.params.num
  const filmesTodos = {
      filme: []
    }

  const response = await axios.get('https://comandotorrents.org/page' + numpag)
      
  let $ = cheerio.load(response.data, { decodeEntities: false })
      
  $('article').each(function (index, elem) {
    var El = $(elem)
    var titulo = El.find('h2', '#entry-title').text()
    var link = El.find('a').attr('href').replace('https://comandotorrents.org/', '')
    var informacoesHtml = El.find('p', 'strong').html()
    var informacoes = El.find('p', 'strong').text()
    var img = $(this).find('img').attr('src')

    filmesTodos.filme.push({'titulo': titulo, 'img': img, 'link': link, 'informacoes': informacoes, 'informacoesHtml': informacoesHtml})
  })

  resp.status(200)
  resp.send(filmesTodos)

} catch (e) {
  resp.status(500)
  resp.send(`Algo deu errado, erro: ${e.message}` )
  console.log(e.message)
}
});


//pesquisa
app.get('/s/', async(req, resp) => {
try {
  let pesquisa = req.query.pesquisar

  let filmesTodos = {
      filme: []
    }
    
    const response = await axios.get('https://comandotorrents.org/?s=' + pesquisa)

    let $ = cheerio.load(response.data, { decodeEntities: false })
    
      $('article').each(function (index, elem) {
        var El = $(elem)
        var titulo = El.find('h2', '#entry-title').text();
        var link = El.find('a').attr('href').replace('https://comandotorrents.org/', '')
        var informacoesHtml = El.find('p', 'strong').html();
        var informacoes = El.find('p', 'strong').text();
        var img = $(this).find('img').attr('src');

        filmesTodos.filme.push({'titulo': titulo, 'img': img, 'link': link, 'informacoes': informacoes, 'informacoesHtml': informacoesHtml})
      })

  resp.status(200)
  resp.send(filmesTodos);
  
} catch (e) {

  resp.status(500)
  resp.send(`Algo deu errado, erro: ${e.message}` )
  console.log(e.message)

}
});

//pagina de download
app.get('/download/:pagina', async(req, resp) => {

  let pagina = req.params.pagina;
  let filmeInfo = {
      duasPartes: 0,
      titulo: '',
      sinopse: '',
      img: '',
      infos: '',
      parte1: {parte: '', 
      variosLinks: 0,
      eps: {
        normal: [],
        variosLinks: []
      }
      },
      parte2: {parte: '', 
      variosLinks: 0,
      eps: {
        normal: [],
        variosLinks: []
      }
      }
    }

try {

  const response = await axios.get('https://comandotorrents.org/' + pagina)

  let $ = cheerio.load(response.data, { decodeEntities: false })

  //console.log($('link[href="https://comandotorrents.org/"]').html())

  //se receber um link errado, o ComandoTorrents manda pra pagina inicial, essa condição checa isso
  if($('link[href="https://comandotorrents.org/"]').html() === null){ 

        filmeInfo.titulo =  $('h1.entry-title').text()
        filmeInfo.infos = $('p').eq('0').text()
        filmeInfo.img = $('img.alignleft.size-full').attr('src')
        filmeInfo.sinopse = $('p').eq('2').text()
        let epsodios = $('.entry-content.cf').html().replace('Pack</a></strong></p>\n<hr>','K-Lite-Codec-Pack</a>')
    
        if (epsodios.includes('K-Lite-Codec-Pack</a>') == false) {
        epsodios = epsodios.split('</iframe>')
        } else {
        epsodios = epsodios.split('K-Lite-Codec-Pack</a>')
        }
        
        let epsodioscut = ''

        // Nem todas as paginas do site seguem o mesmo padrão, 
        // o console vai mostrar se alguma delas não tiver dentro, para depois ganharem uma alternativa
        if(epsodios[1] === undefined){ console.log(`URL fora do padrão: ${pagina}`) }
        //-------------

        if (epsodios[1].includes('<hr>')) {
        epsodioscut = epsodios[1].split('<hr>')
        } else {
        epsodioscut = epsodios[1].split('widget-after-post-content')
        }
        
        // Essa condição verifica se os links de download estão divido em duas parte
        // como Dublado e Legendado por exemplo
        if (epsodioscut[1].includes('widget_custom_html')){
    
            $ = cheerio.load(epsodioscut[0])
            filmeInfo.parte1.parte = $('h2').eq(0).text()
            //console.log($('h2').eq(0))
            $('p').each(function (i, e) {
                
                // se o link de download tiver sub links, como: Epsodio 1: 720p, 1080p, 4K
                if ($(e).find('a').length > 1){
                    filmeInfo.parte1.variosLinks= 1
                    let ex = $(e).html().split('<a href=')
                    let ep = ex[0].replace('</b>','').replace('<b>','')
                    let links = []
            
                    $(e).find('a').each((i,e) => {
                        let link = $(e).attr('href')
                        let valor = $(e).text()
                        links.push({link,valor})
                    })
            
                    filmeInfo.parte1.eps.variosLinks.push({ep, links})
                }else{
                    let ep = $(e).find('b').text() || $(e).find('strong').text() || $(e).text()
                    let link = $(e).find('a').attr('href')
                    filmeInfo.parte1.eps.normal.push({ep, link})
                }
            })

        }else{ // tem duas partes
            
            //--------------------Fazendo a parte um--------------------------

            $ = cheerio.load(epsodioscut[0], { decodeEntities: false })
            filmeInfo.duasPartes = 1
            filmeInfo.parte1.parte = $('h2').eq(0).text()
        
            $('p').each(function (i, e) {
        
                if ($(e).find('a').length > 1){
                    filmeInfo.parte1.variosLinks= 1
                    let ex = $(e).html().split('<a href=')
                    let ep = ex[0].replace('</b>','').replace('<b>','')
                    let links = []
            
                    $(e).find('a').each((i,e) => {
                        let link = $(e).attr('href')
                        let valor = $(e).text()
                        links.push({link,valor})
                    })
            
                    filmeInfo.parte1.eps.variosLinks.push({ep, links})
                }else{
                    let ep = $(e).find('b').text() || $(e).find('strong').text() || $(e).text()
                    let link = $(e).find('a').attr('href')
                    filmeInfo.parte1.eps.normal.push({ep, link})
                }
        
            })
        
            //--------------------Fazendo a parte dois--------------------------
        
            $ = cheerio.load(epsodioscut[1], { decodeEntities: false })
            filmeInfo.parte2.parte = $('h2').eq(0).text()
        
            $('p').each(function (i, e) {
        
                if ($(e).find('a').length > 1){
                    filmeInfo.parte2.variosLinks = 1
                    let ex = $(e).html().split('<a href=')
                    let ep = ex[0]
                    let links = []
            
                    $(e).find('a').each((i,e) => {
                        let link = $(e).attr('href')
                        let valor = $(e).text()
                        links.push({link,valor})
                    })
            
                    filmeInfo.parte2.eps.variosLinks.push({ep, links})
                }else{
                    let ep = $(e).find('b').text() || $(e).find('strong').text() || $(e).text()
                    let link = $(e).find('a').attr('href')
                    filmeInfo.parte2.eps.normal.push({ep, link})
                }
        
            })
        
        }

        resp.status(200)
        resp.header("Content-Type",'application/json')
        resp.send(filmeInfo)

    }else{
        resp.status(404)
        resp.send('Link não encontrado')
    }

} catch (e) {
  resp.status(500)
  resp.send(`Algo deu errado, erro` )
  console.log(e.message)
}
})

// feito pra burlar uma limitação do Telegram ao enviar links de magnet, uso somente do BOT
app.get('/torrent/:magnet', async(req, resp) => {
  resp.status(200)
  resp.redirect(Buffer.from(req.params.magnet, 'base64').toString('utf8'))
})

const port = process.env.PORT || 1337
app.listen(port)