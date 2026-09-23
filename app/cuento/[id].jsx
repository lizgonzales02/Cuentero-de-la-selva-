import { useState, useEffect, useRef } from 'react';
import { View, TextInput, Pressable, Text, Alert, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';

export default function Editor() {
  const db = useSQLiteContext();
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const esNuevo = id === 'nuevo';

  const [titulo, setTitulo] = useState('');
  const [cuerpo, setCuerpo] = useState('');

  const tituloOriginal = useRef('');
  const cuerpoOriginal = useRef('');

  useEffect(() => {
    if (esNuevo) return;
    async function cargar() {
      const fila = await db.getFirstAsync(
        'SELECT titulo, cuerpo FROM cuento WHERE id = ?',
        [Number(id)]
      );
      if (fila) {
        setTitulo(fila.titulo);
        setCuerpo(fila.cuerpo);
        tituloOriginal.current = fila.titulo;
        cuerpoOriginal.current = fila.cuerpo;
      }
    }
    cargar();
  }, [id, esNuevo, db]);

  useEffect(() => {
    if (esNuevo) return;
    function onBeforeRemove(e) {
      const sinGuardar = titulo !== tituloOriginal.current || cuerpo !== cuerpoOriginal.current;
      if (!sinGuardar) return;
      e.preventDefault();
      Alert.alert('Descartar cambios', 'Tienes cambios sin guardar. ¿Deseas descartarlos?', [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Descartar', style: 'destructive', onPress: () => router.dismiss() },
      ]);
    }
    const nav = router;
    const unsubscribe = nav.addListener('beforeRemove', onBeforeRemove);
    return unsubscribe;
  }, [titulo, cuerpo, esNuevo, router]);

  async function guardar() {
    const limpio = titulo.trim();
    if (!limpio) {
      Alert.alert('Falta el titulo', 'Todo cuento necesita un nombre.');
      return;
    }
    const ahora = new Date().toISOString();

    if (esNuevo) {
      await db.runAsync(
        'INSERT INTO cuento (titulo, cuerpo, creado, editado) VALUES (?, ?, ?, ?)',
        [limpio, cuerpo, ahora, ahora]
      );
    } else {
      await db.runAsync(
        'UPDATE cuento SET titulo = ?, cuerpo = ?, editado = ? WHERE id = ?',
        [limpio, cuerpo, ahora, Number(id)]
      );
    }
    router.back();
  }

  function confirmarBorrado() {
    Alert.alert('Borrar cuento', 'Esta accion no se puede deshacer.', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Borrar',
        style: 'destructive',
        onPress: async () => {
          await db.runAsync('DELETE FROM cuento WHERE id = ?', [Number(id)]);
          router.back();
        },
      },
    ]);
  }

  const palabras = cuerpo.trim() ? cuerpo.trim().split(/\s+/).length : 0;

  return (
    <KeyboardAvoidingView
      style={styles.contenedor}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Stack.Screen options={{ title: esNuevo ? 'Nuevo cuento' : 'Editar cuento' }} />

      <TextInput
        style={styles.titulo}
        placeholder="Titulo del cuento"
        value={titulo}
        onChangeText={setTitulo}
      />

      <TextInput
        style={styles.cuerpo}
        placeholder="Habia una vez, en la quebrada..."
        value={cuerpo}
        onChangeText={setCuerpo}
        multiline
        textAlignVertical="top"
      />

      <Text style={styles.contadorPalabras}>{palabras} palabra{palabras !== 1 ? 's' : ''}</Text>

      <Pressable style={styles.guardar} onPress={guardar}>
        <Text style={styles.guardarTexto}>Guardar</Text>
      </Pressable>

      {!esNuevo && (
        <Pressable onPress={confirmarBorrado}>
          <Text style={styles.borrar}>Borrar este cuento</Text>
        </Pressable>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  contenedor: { flex: 1, backgroundColor: '#f7f5f0', padding: 16, gap: 12 },
  titulo: {
    fontSize: 18, fontWeight: '600', backgroundColor: '#fff',
    borderRadius: 10, padding: 12, borderWidth: 1, borderColor: '#e8e2d5',
  },
  cuerpo: {
    flex: 1, fontSize: 15, lineHeight: 22, backgroundColor: '#fff',
    borderRadius: 10, padding: 12, borderWidth: 1, borderColor: '#e8e2d5',
  },
  contadorPalabras: { textAlign: 'right', color: '#7a8b7f', fontSize: 13 },
  guardar: {
    backgroundColor: '#1b4332', borderRadius: 10,
    paddingVertical: 14, alignItems: 'center',
  },
  guardarTexto: { color: '#fff', fontWeight: '600' },
  borrar: { textAlign: 'center', color: '#a4161a', paddingVertical: 10 },
});
