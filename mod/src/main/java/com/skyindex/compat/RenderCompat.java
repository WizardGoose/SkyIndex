package com.skyindex.compat;

import com.mojang.blaze3d.vertex.PoseStack;
import com.mojang.blaze3d.vertex.VertexConsumer;
import net.fabricmc.fabric.api.client.rendering.v1.level.LevelRenderContext;
import net.minecraft.client.renderer.rendertype.RenderType;

import java.lang.reflect.InvocationTargetException;
import java.lang.reflect.Method;
import java.lang.reflect.Proxy;

/** Bridges 26.1.2's immediate buffers and 26.2's deferred submit nodes. */
public final class RenderCompat {
    private static final String LEVEL_CONTEXT =
            "net.fabricmc.fabric.api.client.rendering.v1.level.LevelRenderContext";
    private static final String CUSTOM_RENDERER =
            "net.minecraft.client.renderer.SubmitNodeCollector$CustomGeometryRenderer";
    private static final String ORDERED_COLLECTOR =
            "net.minecraft.client.renderer.OrderedSubmitNodeCollector";
    private static final String MULTI_BUFFER_SOURCE =
            "net.minecraft.client.renderer.MultiBufferSource";

    private RenderCompat() {
    }

    @FunctionalInterface
    public interface Geometry {
        void render(PoseStack.Pose pose, VertexConsumer consumer);
    }

    public static void submit(LevelRenderContext context, RenderType renderType, Geometry geometry) {
        try {
            submitDeferred(context, renderType, geometry);
        } catch (ClassNotFoundException | NoSuchMethodException oldClient) {
            submitImmediate(context, renderType, geometry);
        } catch (ReflectiveOperationException failure) {
            throw reflectionFailure("submit deferred render geometry", failure);
        }
    }

    private static void submitDeferred(LevelRenderContext context, RenderType renderType,
                                       Geometry geometry)
            throws ReflectiveOperationException {
        ClassLoader loader = context.getClass().getClassLoader();
        Class<?> contextType = Class.forName(LEVEL_CONTEXT, false, loader);
        Method collectorGetter = contextType.getMethod("submitNodeCollector");
        Object collector = collectorGetter.invoke(context);

        Class<?> rendererType = Class.forName(CUSTOM_RENDERER, false, loader);
        Object renderer = Proxy.newProxyInstance(loader, new Class<?>[]{rendererType},
                (proxy, method, args) -> switch (method.getName()) {
                    case "render" -> {
                        geometry.render((PoseStack.Pose) args[0], (VertexConsumer) args[1]);
                        yield null;
                    }
                    case "toString" -> "SkyIndex custom geometry";
                    case "hashCode" -> System.identityHashCode(proxy);
                    case "equals" -> proxy == args[0];
                    default -> throw new UnsupportedOperationException(method.toString());
                });

        Class<?> collectorType = Class.forName(ORDERED_COLLECTOR, false, loader);
        Method submit = collectorType.getMethod(
                "submitCustomGeometry", PoseStack.class, RenderType.class, rendererType);
        submit.invoke(collector, context.poseStack(), renderType, renderer);
    }

    private static void submitImmediate(LevelRenderContext context, RenderType renderType,
                                        Geometry geometry) {
        try {
            ClassLoader loader = context.getClass().getClassLoader();
            Class<?> contextType = Class.forName(LEVEL_CONTEXT, false, loader);
            Object buffers = contextType.getMethod("bufferSource").invoke(context);
            Class<?> sourceType = Class.forName(MULTI_BUFFER_SOURCE, false, loader);
            VertexConsumer consumer = (VertexConsumer) sourceType
                    .getMethod("getBuffer", RenderType.class)
                    .invoke(buffers, renderType);
            geometry.render(context.poseStack().last(), consumer);
            buffers.getClass().getMethod("endBatch", RenderType.class).invoke(buffers, renderType);
        } catch (ReflectiveOperationException failure) {
            throw reflectionFailure("submit immediate render geometry", failure);
        }
    }

    private static IllegalStateException reflectionFailure(String action,
                                                           ReflectiveOperationException failure) {
        Throwable cause = failure instanceof InvocationTargetException invocation
                ? invocation.getCause() : failure;
        return new IllegalStateException("Unable to " + action, cause);
    }
}
