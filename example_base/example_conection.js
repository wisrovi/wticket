<script type="module">
  import { Redis } from "https://esm.sh/@upstash/redis";

  const redis = new Redis({
    url: 'https://new-warthog-36731.upstash.io',
    token: 'Ao97AAIgcDGdC0Sh4vNuaFwb97FpvVSketbZfyj-fsxQcV0h34e92w',
  });

  // Ejemplo de uso:
  async function test() {
    // Escribir
    await redis.set('foo', 'bar');
    
    // Leer
    const data = await redis.get('foo');
    console.log("El valor de foo es:", data);
    
    document.body.innerHTML += `<h1>Dato: ${data}</h1>`;
  }

  test();
</script>